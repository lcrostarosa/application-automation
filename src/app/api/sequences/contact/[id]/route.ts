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
		const sequences = await prisma.sequence.findMany({
			where: { ownerId: user.id, contactId: contactId },
		});
		return NextResponse.json({ sequences });
	} catch (error: any) {
		console.error('Error fetching sequences for contact:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to fetch sequences' },
			{ status: 500 }
		);
	}
}
