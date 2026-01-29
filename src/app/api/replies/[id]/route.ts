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
		const { id } = await params;
		const replyId = parseInt(id);
		const reply = await prisma.emailReply.update({
			where: { ownerId: user.id, id: replyId },
			data: {
				processed: true,
			},
		});

		return NextResponse.json({ reply });
	} catch (error: any) {
		console.error('Error updating reply:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to update reply' },
			{ status: 500 }
		);
	}
}
