import { NextRequest, NextResponse } from 'next/server';
import { setupGmailNotifications } from '@/lib/setupGmailNotifications';

export async function POST(_req: NextRequest) {
	try {
		const result = await setupGmailNotifications();
		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		console.error('Setup error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}
