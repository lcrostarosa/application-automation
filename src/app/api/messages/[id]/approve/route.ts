import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser } from '@/services/getUserService';
import { auditUserAction, AUDIT_ACTIONS } from '@/lib/audit';

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// 1. Check authentication
		const { user, error } = await getApiUser();

		if (error) {
			return NextResponse.json(
				{ error: error.error },
				{ status: error.status }
			);
		}

		const { id } = await params;
		const messageId = parseInt(id);

		const message = await prisma.message.update({
			where: { ownerId: user.id, id: messageId },
			data: { needsApproval: false, approved: true, status: 'scheduled' },
		});

		// Audit the message approval
		await auditUserAction(
			request,
			user.id,
			AUDIT_ACTIONS.MESSAGE_APPROVE,
			'message',
			messageId,
			{
				contactId: message.contactId,
				sequenceId: message.sequenceId,
				subject: message.subject,
			},
			'success'
		);

		return NextResponse.json({ message });
	} catch (error: unknown) {
		console.error('Error approving message:', error);
		const message = error instanceof Error ? error.message : 'Failed to approve message';
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
