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
		const contactId = parseInt(id);
		const messages = await prisma.message.findMany({
			where: { ownerId: user.id, contactId: contactId, sequenceId: null },

			orderBy: { createdAt: 'desc' },
		});
		return NextResponse.json({ messages });
	} catch (error: unknown) {
		console.error('Error fetching sequences for contact:', error);
		const message = error instanceof Error ? error.message : 'Failed to fetch sequences';
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
