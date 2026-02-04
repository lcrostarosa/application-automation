import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser } from '@/services/getUserService';
import { checkRateLimit } from '@/lib/rate-limiter';
import { auditUserAction, AUDIT_ACTIONS } from '@/lib/audit';
import { getErrorMessage, isAppError } from '@/lib/errors';

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
		const message = getErrorMessage(error);
		const statusCode = isAppError(error) ? error.statusCode : 500;
		return NextResponse.json(
			{ error: message },
			{ status: statusCode }
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

		// 2. Check rate limit (60 requests per minute per user)
		const rateLimit = await checkRateLimit(String(user.id), 'api');
		if (!rateLimit.allowed) {
			await auditUserAction(
				request,
				user.id,
				AUDIT_ACTIONS.RATE_LIMITED,
				'contact',
				null,
				{ endpoint: 'contacts/[id]' },
				'failure',
				'Rate limit exceeded'
			);
			return NextResponse.json(
				{ error: 'Too many requests. Please try again later.' },
				{ status: 429, headers: rateLimit.headers }
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
				{ status: 400, headers: rateLimit.headers }
			);
		}

		const updatedContact = await prisma.contact.update({
			where: { id: contactId },
			data: updateData,
		});

		// Audit the contact update
		await auditUserAction(
			request,
			user.id,
			AUDIT_ACTIONS.CONTACT_UPDATE,
			'contact',
			contactId,
			{ updatedFields: Object.keys(updateData) },
			'success'
		);

		return NextResponse.json(
			{
				success: true,
				contact: updatedContact,
			},
			{ headers: rateLimit.headers }
		);
	} catch (error) {
		const message = getErrorMessage(error);
		const statusCode = isAppError(error) ? error.statusCode : 500;
		console.error('Error updating contact:', message);
		return NextResponse.json(
			{ success: false, error: message },
			{ status: statusCode }
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

		// 2. Check rate limit (60 requests per minute per user)
		const rateLimit = await checkRateLimit(String(user.id), 'api');
		if (!rateLimit.allowed) {
			await auditUserAction(
				request,
				user.id,
				AUDIT_ACTIONS.RATE_LIMITED,
				'contact',
				null,
				{ endpoint: 'contacts/[id]' },
				'failure',
				'Rate limit exceeded'
			);
			return NextResponse.json(
				{ error: 'Too many requests. Please try again later.' },
				{ status: 429, headers: rateLimit.headers }
			);
		}

		const { id } = await params;
		const contactId = parseInt(id);

		// Get contact info before deletion for audit
		const contact = await prisma.contact.findFirst({
			where: { id: contactId, ownerId: user.id },
		});

		await prisma.contact.delete({
			where: { id: contactId, ownerId: user.id },
		});

		// Audit the contact deletion
		await auditUserAction(
			request,
			user.id,
			AUDIT_ACTIONS.CONTACT_DELETE,
			'contact',
			contactId,
			{ email: contact?.email },
			'success'
		);

		return NextResponse.json({ success: true }, { headers: rateLimit.headers });
	} catch (error) {
		const message = getErrorMessage(error);
		const statusCode = isAppError(error) ? error.statusCode : 500;
		console.error('Error deleting contact:', message);
		return NextResponse.json(
			{ error: message },
			{ status: statusCode }
		);
	}
}
