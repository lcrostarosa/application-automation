import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/services/getUserService';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
	try {
		// 1. Check authentication
		const { user, error } = await getApiUser();
		if (error) {
			return NextResponse.json(
				{ error: error.error },
				{ status: error.status }
			);
		}

		// 2. Fetch sequences for the user
		const sequences = await prisma.sequence.findMany({
			where: { ownerId: user.id },
			include: {
				contact: true,
				messages: {
					orderBy: { createdAt: 'desc' },
				},
				emailReplies: {
					orderBy: { replyDate: 'desc' },
				},
			},
		});

		// 3. Return sequences
		return NextResponse.json({ sequences });
	} catch (error) {
		console.error('Error fetching sequences:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch sequences' },
			{ status: 500 }
		);
	}
}
