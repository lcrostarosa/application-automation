import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/services/getUserService';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
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
		});

		// 3. Return sequences
		return NextResponse.json({ sequences });
	} catch (error: any) {
		console.error('Error fetching sequences:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to fetch sequences' },
			{ status: 500 }
		);
	}
}
