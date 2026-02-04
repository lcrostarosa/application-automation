import { NextRequest, NextResponse } from 'next/server';
import { setupGmailNotifications } from '@/lib/setupGmailNotifications';

export async function POST(_req: NextRequest) {
	try {
		const result = await setupGmailNotifications();
		return NextResponse.json({ success: true, data: result });
	} catch (error: unknown) {
		console.error('Setup error:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
