import { NextRequest, NextResponse } from 'next/server';
import { gmail_v1 } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { verifyPubSubToken } from '@/lib/pubsub-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { auditWebhook, AUDIT_ACTIONS } from '@/lib/audit';
import { getErrorMessage, isAppError, ExternalServiceError } from '@/lib/errors';
import {
	getGmailClientForUser,
	findUserByGmailAddress,
	GmailCredentialError,
} from '@/lib/gmailClientFactory';

interface GmailHeader {
	name: string;
	value: string;
}

interface PubSubMessage {
	emailAddress: string;
	historyId: string;
}

export async function POST(req: NextRequest) {
	const clientIp = getClientIp(req);

	// Check rate limit (100 requests per minute per IP)
	const rateLimit = await checkRateLimit(clientIp, 'webhook');
	if (!rateLimit.allowed) {
		await auditWebhook(
			req,
			AUDIT_ACTIONS.WEBHOOK_RATE_LIMITED,
			{ ip: clientIp },
			'failure',
			'Rate limit exceeded'
		);
		return NextResponse.json(
			{ error: 'Too many requests' },
			{ status: 429, headers: rateLimit.headers }
		);
	}

	// Verify Pub/Sub OIDC token
	const authHeader = req.headers.get('authorization');
	const authResult = await verifyPubSubToken(authHeader);

	if (!authResult.valid) {
		await auditWebhook(
			req,
			AUDIT_ACTIONS.WEBHOOK_REJECTED,
			{ ip: clientIp, reason: authResult.error },
			'failure',
			authResult.error
		);
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: rateLimit.headers }
		);
	}

	try {
		const body = await req.json();
		console.log('Gmail webhook received:', body);

		// Decode the Pub/Sub message
		const message: PubSubMessage = JSON.parse(
			Buffer.from(body.message.data, 'base64').toString()
		);

		console.log('Decoded message:', message);

		// Find the user by their Gmail address
		const userId = await findUserByGmailAddress(message.emailAddress);

		if (!userId) {
			console.log(
				`No user found for Gmail address: ${message.emailAddress}`
			);
			// Still return success to acknowledge the message
			return NextResponse.json(
				{ success: true, message: 'No matching user' },
				{ headers: rateLimit.headers }
			);
		}

		// Log successful webhook receipt
		await auditWebhook(
			req,
			AUDIT_ACTIONS.WEBHOOK_RECEIVED,
			{ historyId: message.historyId, ip: clientIp, userId },
			'success'
		);

		// Check for new emails using user-specific credentials
		await checkForNewEmails(userId, message.historyId);

		return NextResponse.json({ success: true }, { headers: rateLimit.headers });
	} catch (error) {
		console.error('Webhook error:', error);
		const errorMessage = getErrorMessage(error);
		const statusCode = isAppError(error) ? error.statusCode : 500;
		await auditWebhook(
			req,
			AUDIT_ACTIONS.WEBHOOK_RECEIVED,
			{ ip: clientIp },
			'failure',
			errorMessage
		);
		return NextResponse.json(
			{ error: errorMessage },
			{ status: statusCode, headers: rateLimit.headers }
		);
	}
}

async function checkForNewEmails(userId: number, historyId: string) {
	let gmail: gmail_v1.Gmail;
	try {
		const clientResult = await getGmailClientForUser(userId);
		gmail = clientResult.gmail;
	} catch (error) {
		if (error instanceof GmailCredentialError) {
			console.error(
				`Invalid credentials for user ${userId}: ${error.message}`
			);
			return;
		}
		throw error;
	}

	try {
		// Use historyId to get only NEW changes (much more efficient)
		const historyResponse = await gmail.users.history.list({
			userId: 'me',
			startHistoryId: historyId,
			historyTypes: ['messageAdded'], // Only new messages
		});

		if (historyResponse.data.history) {
			for (const historyItem of historyResponse.data.history) {
				if (historyItem.messagesAdded) {
					for (const messageAdded of historyItem.messagesAdded) {
						await processMessage(gmail, messageAdded.message!.id!, userId);
					}
				}
			}
		}
	} catch (error) {
		const gmailError = new ExternalServiceError('Gmail', getErrorMessage(error));
		console.error('Error checking emails:', gmailError.message);
		// Fallback to recent messages if history fails
		await fallbackToRecentMessages(gmail, userId);
	}
}

// Fallback method (your original approach)
async function fallbackToRecentMessages(gmail: gmail_v1.Gmail, userId: number) {
	const response = await gmail.users.messages.list({
		userId: 'me',
		q: 'in:inbox',
		maxResults: 10,
	});

	if (response.data.messages) {
		for (const message of response.data.messages) {
			await processMessage(gmail, message.id!, userId);
		}
	}
}

async function processMessage(
	gmail: gmail_v1.Gmail,
	messageId: string,
	userId: number
) {
	try {
		const message = await gmail.users.messages.get({
			userId: 'me',
			id: messageId,
		});

		const headers = message.data.payload?.headers as GmailHeader[] | undefined;
		const threadId = message.data.threadId;

		if (!headers) return;

		// Extract sender email and USE it for validation
		const from = headers.find((h: GmailHeader) => h.name === 'From')?.value;
		const senderEmail = extractEmailFromHeader(from);

		// Check if this is a reply to one of our sent emails (for this user)
		const sentMessage = await prisma.message.findFirst({
			where: {
				threadId: threadId,
				direction: 'outbound',
				ownerId: userId,
			},
			include: {
				contact: true,
			},
		});

		if (sentMessage) {
			// Validate that the reply is from the same contact we sent to
			if (senderEmail !== sentMessage.contact.email) {
				console.log(
					'Reply from different email than original contact, skipping'
				);
				return;
			}

			// Rest of processing...
			const subject = headers.find((h: GmailHeader) => h.name === 'Subject')?.value;

			// Extract email body (simplified)
			let bodyContent = '';
			if (message.data.payload?.parts) {
				const textPart = message.data.payload.parts.find(
					(part: gmail_v1.Schema$MessagePart) => part.mimeType === 'text/plain'
				);
				if (textPart?.body?.data) {
					bodyContent = Buffer.from(textPart.body.data, 'base64').toString();
				}
			} else if (message.data.payload?.body?.data) {
				bodyContent = Buffer.from(
					message.data.payload.body.data,
					'base64'
				).toString();
			}

			// Store the reply
			await prisma.message.create({
				data: {
					contactId: sentMessage.contactId,
					ownerId: sentMessage.ownerId,
					subject: subject || 'Reply',
					contents: bodyContent,
					direction: 'inbound',
					messageId: messageId,
					threadId: threadId,
					createdAt: new Date(parseInt(message.data.internalDate!)),
				},
			});

			// Update contact as replied
			await prisma.contact.update({
				where: { id: sentMessage.contactId },
				data: {
					replied: true,
					lastActivity: new Date(),
				},
			});

			// Mark original message as having reply
			await prisma.message.update({
				where: { id: sentMessage.id },
				data: { hasReply: true },
			});

			console.log(
				'Reply processed from:',
				senderEmail,
				'for contact:',
				sentMessage.contact.email
			);
		}
	} catch (error) {
		console.error('Error processing message:', getErrorMessage(error));
	}
}

// Helper function to extract email from "Name <email@domain.com>" format
function extractEmailFromHeader(fromHeader: string | undefined): string {
	if (!fromHeader) return '';
	const emailMatch = fromHeader.match(/<(.+?)>/);
	return emailMatch ? emailMatch[1] : fromHeader;
}
