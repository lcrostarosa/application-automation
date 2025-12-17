import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN!;
const SENDER_EMAIL = process.env.EMAIL_ADDRESS!;

export async function sendGmail({
	to,
	subject,
	text,
	html,
}: {
	to: string;
	subject: string;
	text?: string;
	html?: string;
}) {
	try {
		// Create OAuth2 client
		const oAuth2Client = new google.auth.OAuth2(
			CLIENT_ID,
			CLIENT_SECRET,
			REDIRECT_URI
		);

		// Set credentials
		oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

		// Get Gmail API instance
		const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

		// Create email content
		const emailContent = [
			`To: ${to}`,
			`From: ${SENDER_EMAIL}`,
			`Subject: ${subject}`,
			'Content-Type: text/html; charset=utf-8',
			'',
			html || text || '',
		].join('\n');

		// Encode email in base64
		const encodedMessage = Buffer.from(emailContent).toString('base64');

		console.log('Sending email via Gmail API...');

		// Send email using Gmail API directly
		const result = await gmail.users.messages.send({
			userId: 'me',
			requestBody: {
				raw: encodedMessage,
			},
		});

		console.log('Email sent successfully!');
		return {
			messageId: result.data.id,
			threadId: result.data.threadId,
			data: result.data,
		};
	} catch (error) {
		console.error('Gmail sending error:', error);
		throw error;
	}
}
