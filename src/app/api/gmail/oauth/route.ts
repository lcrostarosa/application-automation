import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/services/getUserService';
import { createOAuth2Client, getGmailScopes } from '@/lib/gmail';
import { createOAuthState } from '@/lib/oauthState';

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

/**
 * GET /api/gmail/oauth
 * Initiates the Google OAuth flow by redirecting to Google's consent screen
 */
export async function GET(_req: NextRequest) {
	try {
		const { user, error } = await getApiUser();
		if (error) {
			// Redirect to login if not authenticated
			return NextResponse.redirect(
				`${APP_BASE_URL}/api/auth/login?returnTo=/api/gmail/oauth`
			);
		}

		const oauth2Client = createOAuth2Client();

		// Create signed state containing user ID
		const state = createOAuthState(user.id);

		const authUrl = oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: getGmailScopes(),
			prompt: 'consent', // Force consent to ensure we get a refresh token
			state,
		});

		return NextResponse.redirect(authUrl);
	} catch (error) {
		console.error('Error initiating OAuth flow:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.redirect(
			`${APP_BASE_URL}/settings?error=${encodeURIComponent(message)}`
		);
	}
}
