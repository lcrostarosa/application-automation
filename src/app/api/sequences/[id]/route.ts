import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser } from '@/services/getUserService';

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
	} catch (error) {
		console.error('Error fetching sequences for contact:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch sequences' },
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
		return NextResponse.json({
			updatedSequence,
			updatedMessages,
			updatedContact,
		});
	} catch (error) {
		console.error('Error updating sequence:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to update sequence' },
			{ status: 500 }
		);
	}
}
