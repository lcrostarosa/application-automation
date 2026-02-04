import { google, gmail_v1 } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { decryptRefreshToken } from '@/lib/encryption';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

export interface GmailClientResult {
	gmail: gmail_v1.Gmail;
	gmailAddress: string;
	credentialId: number;
}

export class GmailCredentialError extends Error {
	constructor(
		message: string,
		public code:
			| 'NO_CREDENTIALS'
			| 'INVALID_CREDENTIALS'
			| 'DECRYPTION_FAILED'
			| 'TOKEN_EXPIRED'
	) {
		super(message);
		this.name = 'GmailCredentialError';
	}
}

/**
 * Gets a Gmail client configured with the user's credentials
 * @param userId The user's ID
 * @returns Gmail client instance and user's Gmail address
 * @throws GmailCredentialError if credentials are missing or invalid
 */
export async function getGmailClientForUser(
	userId: number
): Promise<GmailClientResult> {
	const credential = await prisma.userGmailCredential.findUnique({
		where: { userId },
	});

	if (!credential) {
		throw new GmailCredentialError(
			'Gmail credentials not configured for this user',
			'NO_CREDENTIALS'
		);
	}

	if (!credential.isValid) {
		throw new GmailCredentialError(
			`Gmail credentials are invalid: ${credential.lastError || 'Unknown error'}`,
			'INVALID_CREDENTIALS'
		);
	}

	let refreshToken: string;
	try {
		refreshToken = decryptRefreshToken(credential.encryptedRefreshToken);
	} catch (error) {
		console.error('Failed to decrypt refresh token:', error);
		throw new GmailCredentialError(
			'Failed to decrypt refresh token',
			'DECRYPTION_FAILED'
		);
	}

	const oAuth2Client = new google.auth.OAuth2(
		CLIENT_ID,
		CLIENT_SECRET,
		REDIRECT_URI
	);
	oAuth2Client.setCredentials({ refresh_token: refreshToken });

	const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

	return {
		gmail,
		gmailAddress: credential.gmailAddress,
		credentialId: credential.id,
	};
}

/**
 * Validates a user's Gmail credentials by making a test API call
 * Updates the credential record with validation status
 * @param userId The user's ID
 * @returns true if credentials are valid, false otherwise
 */
export async function validateGmailCredentials(userId: number): Promise<boolean> {
	const credential = await prisma.userGmailCredential.findUnique({
		where: { userId },
	});

	if (!credential) {
		return false;
	}

	try {
		const { gmail } = await getGmailClientForUser(userId);

		// Test the credentials by getting the user's profile
		const profile = await gmail.users.getProfile({ userId: 'me' });

		// Update credential as valid
		await prisma.userGmailCredential.update({
			where: { id: credential.id },
			data: {
				isValid: true,
				lastValidatedAt: new Date(),
				lastError: null,
				gmailAddress: profile.data.emailAddress || credential.gmailAddress,
			},
		});

		return true;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';

		// Update credential as invalid
		await prisma.userGmailCredential.update({
			where: { id: credential.id },
			data: {
				isValid: false,
				lastValidatedAt: new Date(),
				lastError: errorMessage,
			},
		});

		return false;
	}
}

/**
 * Gets the Gmail credential record for a user (without decrypting)
 * Useful for checking status without needing the actual token
 */
export async function getGmailCredentialStatus(userId: number) {
	const credential = await prisma.userGmailCredential.findUnique({
		where: { userId },
		select: {
			id: true,
			gmailAddress: true,
			isValid: true,
			lastValidatedAt: true,
			lastError: true,
			watchExpiration: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	return credential;
}

/**
 * Finds a user by their Gmail address
 * Used for routing incoming webhook notifications
 */
export async function findUserByGmailAddress(
	gmailAddress: string
): Promise<number | null> {
	const credential = await prisma.userGmailCredential.findFirst({
		where: { gmailAddress },
		select: { userId: true },
	});

	return credential?.userId ?? null;
}
