import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/services/getUserService';
import { prisma } from '@/lib/prisma';

export async function PUT(_request: NextRequest) {
	try {
		// 1. Check authentication
		const { user, error } = await getApiUser();
		if (error) {
			return NextResponse.json(
				{ error: error.error },
				{ status: error.status }
			);
		}

		const activeSequences = await prisma.sequence.findMany({
			where: { ownerId: user.id, active: true },
			select: { id: true, contactId: true },
		});

		const sequenceIds = activeSequences.map((s) => s.id);
		if (sequenceIds.length === 0) {
			return NextResponse.json({
				updatedSequences: 0,
				updatedMessages: 0,
				updatedContacts: 0,
			});
		}

		const updatedSequences = await prisma.sequence.updateMany({
			where: { id: { in: sequenceIds } },
			data: { active: false, endDate: new Date() },
		});

		const updatedMessages = await prisma.message.updateMany({
			where: {
				ownerId: user.id,
				sequenceId: { in: sequenceIds },
				status: { in: ['pending', 'scheduled'] },
			},
			data: { status: 'cancelled', needsFollowUp: false },
		});

		const contactIds = Array.from(
			new Set(activeSequences.map((s) => s.contactId).filter(Boolean))
		) as number[];

		const updatedContacts = await prisma.contact.updateMany({
			where: { id: { in: contactIds } },
			data: { active: false },
		});

		return NextResponse.json({
			updatedSequences,
			updatedMessages,
			updatedContacts,
		});
	} catch (error: unknown) {
		console.error('Error updating sequences:', error);
		const message = error instanceof Error ? error.message : 'Failed to deactivate all sequences';
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
