import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN!;

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		console.log('Gmail webhook received:', body);

		// Decode the Pub/Sub message
		const message = JSON.parse(
			Buffer.from(body.message.data, 'base64').toString()
		);

		console.log('Decoded message:', message);

		// Check for new emails
		await checkForNewEmails(message.historyId);

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error('Webhook error:', error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

async function checkForNewEmails(historyId: string) {
	const oAuth2Client = new google.auth.OAuth2(
		CLIENT_ID,
		CLIENT_SECRET,
		REDIRECT_URI
	);
	oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
	const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

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
						await processMessage(gmail, messageAdded.message!.id!);
					}
				}
			}
		}
	} catch (error) {
		console.error('Error checking emails:', error);
		// Fallback to recent messages if history fails
		await fallbackToRecentMessages(gmail);
	}
}

// Fallback method (your original approach)
async function fallbackToRecentMessages(gmail: any) {
	const response = await gmail.users.messages.list({
		userId: 'me',
		q: 'in:inbox',
		maxResults: 10,
	});

	if (response.data.messages) {
		for (const message of response.data.messages) {
			await processMessage(gmail, message.id!);
		}
	}
}

async function processMessage(gmail: any, messageId: string) {
	try {
		const message = await gmail.users.messages.get({
			userId: 'me',
			id: messageId,
		});

		const headers = message.data.payload.headers;
		const threadId = message.data.threadId;

		// Extract sender email and USE it for validation
		const from = headers.find((h: any) => h.name === 'From')?.value;
		const senderEmail = extractEmailFromHeader(from);

		// Check if this is a reply to one of our sent emails
		const sentMessage = await prisma.message.findFirst({
			where: {
				threadId: threadId,
				direction: 'outbound',
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
			const subject = headers.find((h: any) => h.name === 'Subject')?.value;

			// Extract email body (simplified)
			let bodyContent = '';
			if (message.data.payload.parts) {
				const textPart = message.data.payload.parts.find(
					(part: any) => part.mimeType === 'text/plain'
				);
				if (textPart?.body?.data) {
					bodyContent = Buffer.from(textPart.body.data, 'base64').toString();
				}
			} else if (message.data.payload.body?.data) {
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
					createdAt: new Date(parseInt(message.data.internalDate)),
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
		console.error('Error processing message:', error);
	}
}

// Helper function to extract email from "Name <email@domain.com>" format
function extractEmailFromHeader(fromHeader: string): string {
	const emailMatch = fromHeader?.match(/<(.+?)>/);
	return emailMatch ? emailMatch[1] : fromHeader;
}
