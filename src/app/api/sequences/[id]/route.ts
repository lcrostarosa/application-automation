import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser } from '@/services/getUserService';
import { checkRateLimit } from '@/lib/rate-limiter';
import { auditUserAction, AUDIT_ACTIONS } from '@/lib/audit';

export async function GET(
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
		const sequenceId = parseInt(id);
		const sequence = await prisma.sequence.findFirst({
			where: { ownerId: user.id, id: sequenceId },
			include: {
				messages: {
					orderBy: { createdAt: 'desc' },
				},
				emailReplies: {
					orderBy: { replyDate: 'desc' },
				},
			},
		});
		return NextResponse.json({ sequence });
	} catch (error: unknown) {
		console.error('Error fetching sequences for contact:', error);
		const message = error instanceof Error ? error.message : 'Failed to fetch sequences';
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}

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

		// 2. Check rate limit (60 requests per minute per user)
		const rateLimit = await checkRateLimit(String(user.id), 'api');
		if (!rateLimit.allowed) {
			await auditUserAction(
				request,
				user.id,
				AUDIT_ACTIONS.RATE_LIMITED,
				'sequence',
				null,
				{ endpoint: 'sequences/[id]' },
				'failure',
				'Rate limit exceeded'
			);
			return NextResponse.json(
				{ error: 'Too many requests. Please try again later.' },
				{ status: 429, headers: rateLimit.headers }
			);
		}

		const { id } = await params;
		const sequenceId = parseInt(id);
		const updatedSequence = await prisma.sequence.update({
			where: { ownerId: user.id, id: sequenceId },
			data: { active: false, endDate: new Date() },
		});
		const updatedMessages = await prisma.message.updateMany({
			where: {
				sequenceId: sequenceId,
				ownerId: user.id,
				status: { in: ['pending', 'scheduled'] },
			},
			data: { status: 'cancelled', needsFollowUp: false },
		});
		const updatedContact = await prisma.contact.update({
			where: { id: updatedSequence.contactId },
			data: { active: false },
		});

		// Audit the sequence deactivation
		await auditUserAction(
			request,
			user.id,
			AUDIT_ACTIONS.SEQUENCE_DEACTIVATE,
			'sequence',
			sequenceId,
			{
				contactId: updatedSequence.contactId,
				cancelledMessages: updatedMessages.count,
			},
			'success'
		);

		return NextResponse.json(
			{
				updatedSequence,
				updatedMessages,
				updatedContact,
			},
			{ headers: rateLimit.headers }
		);
	} catch (error: unknown) {
		console.error('Error updating sequence:', error);
		const message = error instanceof Error ? error.message : 'Failed to update sequence';
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
