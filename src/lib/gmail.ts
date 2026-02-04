import { google } from 'googleapis';
import {
	getGmailClientForUser,
	GmailCredentialError,
} from '@/lib/gmailClientFactory';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

export { GmailCredentialError };

export async function sendGmail({
	userId,
	to,
	subject,
	text,
	html,
	inReplyTo,
	references,
	threadId,
}: {
	userId: number;
	to: string;
	subject: string;
	text?: string;
	html?: string;
	// Optional threading headers / thread id for replies
	inReplyTo?: string; // original message-id (e.g. <abc@google.com>)
	references?: string[]; // list of message-ids to include in References header
	threadId?: string; // Gmail threadId to explicitly attach to
}) {
	// Get user-specific Gmail client
	const { gmail, gmailAddress } = await getGmailClientForUser(userId);

	// Build headers for threading if provided
	const headers: string[] = [];
	headers.push(`To: ${to}`);
	headers.push(`From: ${gmailAddress}`);
	headers.push(`Subject: ${subject}`);
	if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
	if (references && references.length > 0)
		headers.push(`References: ${references.join(' ')}`);

	// Minimal HTML/plain multipart fallback
	headers.push('MIME-Version: 1.0');
	headers.push('Content-Type: text/html; charset=utf-8');

	const body = html || text || '';
	const emailContent = headers.join('\r\n') + '\r\n\r\n' + body;

	// Gmail API expects base64url encoding (RFC 4648 §5) - replace +/ with -_ and strip padding
	const encodedMessage = Buffer.from(emailContent)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

	console.log(`Sending email via Gmail API for user ${userId}...`);

	// Send email using Gmail API directly
	const requestBody: { raw: string; threadId?: string } = { raw: encodedMessage };
	if (threadId) requestBody.threadId = threadId;

	const result = await gmail.users.messages.send({
		userId: 'me',
		requestBody,
	});

	// Fetch metadata for the sent message to extract the RFC Message-ID header
	let messageHeaderId: string | null = null;
	try {
		const sent = await gmail.users.messages.get({
			userId: 'me',
			id: result.data.id!,
			format: 'metadata',
			metadataHeaders: ['Message-ID'],
		});
		const sentHeaders = sent.data.payload?.headers || [];
		const mid = sentHeaders.find(
			(h: { name?: string | null; value?: string | null }) =>
				h.name?.toLowerCase() === 'message-id'
		);
		if (mid && mid.value) messageHeaderId = mid.value;
	} catch (err) {
		console.warn('Failed to fetch sent message metadata:', err);
	}

	console.log('Email sent successfully!');
	return {
		messageId: result.data.id,
		threadId: result.data.threadId,
		data: result.data,
		messageHeaderId,
	};
}

/**
 * Creates an OAuth2 client for the Google OAuth flow
 * (Used during OAuth authorization, not for authenticated requests)
 */
export function createOAuth2Client() {
	return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * Gets the scopes required for Gmail operations
 */
export function getGmailScopes(): string[] {
	return [
		'https://www.googleapis.com/auth/gmail.send',
		'https://www.googleapis.com/auth/gmail.readonly',
		'https://www.googleapis.com/auth/gmail.modify',
		'https://www.googleapis.com/auth/userinfo.email',
	];
}
