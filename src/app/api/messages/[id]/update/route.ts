import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser } from '@/services/getUserService';

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

		const { contents, subject } = await request.json();

		const { id } = await params;
		const messageId = parseInt(id);

		const message = await prisma.message.update({
			where: { ownerId: user.id, id: messageId },
			data: {
				contents: contents,
				subject: subject,
				status: 'scheduled',
				approved: true,
			},
		});

		return NextResponse.json({ message });
	} catch (error: any) {
		console.error('Error approving message:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to approve message' },
			{ status: 500 }
		);
	}
}
