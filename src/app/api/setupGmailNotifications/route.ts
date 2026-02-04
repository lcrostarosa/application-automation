import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/services/getUserService';
import { setupGmailNotificationsForUser } from '@/lib/setupGmailNotifications';
import { GmailCredentialError } from '@/lib/gmailClientFactory';

export async function POST(_req: NextRequest) {
	try {
		const { user, error } = await getApiUser();
		if (error) {
			return NextResponse.json({ error: error.error }, { status: error.status });
		}

		const result = await setupGmailNotificationsForUser(user.id);
		return NextResponse.json({ success: true, data: result });
	} catch (error: unknown) {
		console.error('Setup error:', error);

		if (error instanceof GmailCredentialError) {
			return NextResponse.json(
				{ error: error.message, code: error.code },
				{ status: 400 }
			);
		}

		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
