import { NextRequest, NextResponse } from 'next/server';
import { runGenerateNextMessages } from './generate-next-messages/handler';
import { runUpdatePendingMessages } from './update-pending-messages/handler';
import { runSendScheduledMessages } from './send-scheduled-messages/handler';

export async function GET(req: NextRequest) {
	try {
		const authHeader = req.headers.get('authorization');
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const generate = await runGenerateNextMessages({ limit: 50 });
		const update = await runUpdatePendingMessages({ limit: 50 });
		const send = await runSendScheduledMessages({ limit: 50 });

		return NextResponse.json({
			success: true,
			results: [generate, update, send],
		});
	} catch (err: any) {
		console.error('Orchestrator error:', err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
