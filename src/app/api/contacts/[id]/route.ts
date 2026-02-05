import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser } from '@/services/getUserService';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const contactId = parseInt(id);
		const contact = await prisma.contact.findUnique({
			where: { id: contactId },
		});
		if (!contact) {
			return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
		}
		return NextResponse.json(contact);
	} catch (error) {
		console.error('Error fetching contact:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch contact' },
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
		const contactId = parseInt(id);
		const body = await request.json();

		// Remove id from the update data since we don't want to update the ID
		const { id: _bodyId, ...updateData } = body;

		// Convert importance to integer if it exists
		if (updateData.importance !== undefined && updateData.importance !== '') {
			updateData.importance = parseInt(updateData.importance);
		} else {
			updateData.importance = null; // Remove importance if not set
		}

		const existingContact = await prisma.contact.findFirst({
			where: {
				ownerId: user.id,
				email: updateData.email,
			},
		});

		if (existingContact && existingContact.id !== contactId) {
			return NextResponse.json(
				{
					success: false,
					error: 'Contact with this email already exists',
				},
				{ status: 400 }
			);
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

export async function DELETE(
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

		await prisma.contact.delete({
			where: { id: contactId, ownerId: user.id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting contact:', error);
		return NextResponse.json(
			{ error: 'Failed to delete contact' },
			{ status: 500 }
		);
	}
}
