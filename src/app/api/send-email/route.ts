import { NextRequest, NextResponse } from 'next/server';
import { sendGmail } from '@/lib/gmail';
import { storeSentEmail } from '@/services/emailService';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
	try {
		const session = await auth0.getSession();

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { to, subject, body } = await req.json();

		if (!to || !subject || !body) {
			return NextResponse.json(
				{ error: 'Missing parameters' },
				{ status: 400 }
			);
		}

		const result = await sendGmail({ to, subject, html: body });

		const user = await prisma.user.findUnique({
			where: { auth0Id: session.user.sub },
		});

		if (user && result.messageId && result.threadId) {
			await storeSentEmail({
				email: to,
				ownerId: user.id,
				subject,
				contents: body,
				messageId: result.messageId,
				threadId: result.threadId,
			});
		}

		return NextResponse.json({
			success: true,
			messageId: result.messageId,
			threadId: result.threadId,
		});
	} catch (error: any) {
		console.error('Email send error:', error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
