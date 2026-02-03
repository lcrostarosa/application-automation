import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser } from '@/services/getUserService';

export async function GET(request: NextRequest) {
	try {
		// 1. Check authentication
		const { user, error } = await getApiUser();

		if (error) {
			return NextResponse.json(
				{ error: error.error },
				{ status: error.status }
			);
		}

		const messages = await prisma.message.findMany({
			where: { ownerId: user.id, status: { in: ['pending', 'scheduled'] } },
			include: { contact: true },
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json({ messages });
	} catch (error: any) {
		console.error('Error fetching pending messages:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to fetch pending messages' },
			{ status: 500 }
		);
	}
}
