import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const contactId = parseInt(id);
		const body = await request.json();

		// Remove id from the update data since we don't want to update the ID
		const { id: bodyId, ...updateData } = body;

		// Convert importance to integer if it exists
		if (updateData.importance) {
			updateData.importance = parseInt(updateData.importance);
		}

		const updatedContact = await prisma.contact.update({
			where: { id: contactId },
			data: updateData,
		});

		return NextResponse.json({
			success: true,
			contact: updatedContact,
		});
	} catch (error) {
		console.error('Error updating contact:', error);
		let message = 'Unknown error';
		let stack = undefined;
		if (error instanceof Error) {
			message = error.message;
			stack = error.stack;
		}
		console.error('Error details:', {
			message,
			stack,
		});
		return NextResponse.json(
			{ success: false, error: 'Failed to update contact' },
			{ status: 500 }
		);
	}
}
