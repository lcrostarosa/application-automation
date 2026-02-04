import { NextRequest, NextResponse } from 'next/server';
import { createOAuth2Client } from '@/lib/gmail';
import { verifyOAuthState } from '@/lib/oauthState';
import { encryptRefreshToken } from '@/lib/encryption';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

/**
 * GET /api/gmail/callback
 * Handles the OAuth callback from Google after user consents
 */
export async function GET(req: NextRequest) {
	const searchParams = req.nextUrl.searchParams;
	const code = searchParams.get('code');
	const state = searchParams.get('state');
	const errorParam = searchParams.get('error');

	// Handle OAuth errors from Google
	if (errorParam) {
		console.error('OAuth error from Google:', errorParam);
		return NextResponse.redirect(
			`${APP_BASE_URL}/settings?gmail_error=${encodeURIComponent(errorParam)}`
		);
	}

	// Validate required parameters
	if (!code) {
		return NextResponse.redirect(
			`${APP_BASE_URL}/settings?gmail_error=${encodeURIComponent('Missing authorization code')}`
		);
	}

	if (!state) {
		return NextResponse.redirect(
			`${APP_BASE_URL}/settings?gmail_error=${encodeURIComponent('Missing state parameter')}`
		);
	}

	// Verify state and extract user ID
	let userId: number;
	try {
		userId = verifyOAuthState(state);
	} catch (error) {
		console.error('State verification failed:', error);
		const message = error instanceof Error ? error.message : 'Invalid state';
		return NextResponse.redirect(
			`${APP_BASE_URL}/settings?gmail_error=${encodeURIComponent(message)}`
		);
	}

	// Verify user exists
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		return NextResponse.redirect(
			`${APP_BASE_URL}/settings?gmail_error=${encodeURIComponent('User not found')}`
		);
	}

	try {
		const oauth2Client = createOAuth2Client();

		// Exchange authorization code for tokens
		const { tokens } = await oauth2Client.getToken(code);

		if (!tokens.refresh_token) {
			return NextResponse.redirect(
				`${APP_BASE_URL}/settings?gmail_error=${encodeURIComponent('No refresh token received. Please revoke app access in Google settings and try again.')}`
			);
		}

		// Set credentials to fetch user info
		oauth2Client.setCredentials(tokens);

		// Get user's email address
		const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
		const userInfo = await oauth2.userinfo.get();
		const gmailAddress = userInfo.data.email;

		if (!gmailAddress) {
			return NextResponse.redirect(
				`${APP_BASE_URL}/settings?gmail_error=${encodeURIComponent('Could not retrieve email address')}`
			);
		}

		// Encrypt the refresh token
		const encryptedRefreshToken = encryptRefreshToken(tokens.refresh_token);

		// Upsert the credential record
		await prisma.userGmailCredential.upsert({
			where: { userId },
			create: {
				userId,
				encryptedRefreshToken,
				gmailAddress,
				isValid: true,
				lastValidatedAt: new Date(),
			},
			update: {
				encryptedRefreshToken,
				gmailAddress,
				isValid: true,
				lastValidatedAt: new Date(),
				lastError: null,
			},
		});

		console.log(`Gmail credentials saved for user ${userId}: ${gmailAddress}`);

		return NextResponse.redirect(
			`${APP_BASE_URL}/settings?gmail_success=true`
		);
	} catch (error) {
		console.error('Error exchanging OAuth code:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.redirect(
			`${APP_BASE_URL}/settings?gmail_error=${encodeURIComponent(message)}`
		);
	}
}
