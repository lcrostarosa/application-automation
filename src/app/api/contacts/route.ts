import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
	try {
		// 1. Check authentication
		const session = await auth0.getSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// 2. Get user from database
		const user = await prisma.user.findUnique({
			where: { auth0Id: session.user.sub },
		});
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// 3. Fetch contacts for the user
		const contacts = await prisma.contact.findMany({
			where: { ownerId: user.id },
		});

		// 4. Return contacts
		return NextResponse.json({ contacts });
	} catch (error: any) {
		console.error('Error fetching contacts:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to fetch contacts' },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		// 1. Check authentication
		const session = await auth0.getSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// 2. Get user from database
		const user = await prisma.user.findUnique({
			where: { auth0Id: session.user.sub },
		});

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// 3. Parse request body
		const {
			firstName,
			lastName,
			company,
			title,
			email,
			phone,
			linkedIn,
			importance,
			associatedRole,
		} = await req.json();

		// 4. Validate required fields
		if (!firstName || !lastName || !email) {
			return NextResponse.json(
				{ error: 'Missing required fields: firstName, lastName, email' },
				{ status: 400 }
			);
		}

		// 5. Validate contact does not already exist for this user
		const existingContact = await prisma.contact.findFirst({
			where: {
				ownerId: user.id,
				email: email,
			},
		});

		if (existingContact) {
			const isIdentical =
				existingContact.firstName === firstName &&
				existingContact.lastName === lastName &&
				existingContact.company === (company || null) &&
				existingContact.title === (title || null) &&
				existingContact.email === email &&
				existingContact.phone === (phone || null) &&
				existingContact.linkedIn === (linkedIn || null) &&
				existingContact.importance === parseInt(importance) &&
				existingContact.associatedRole === (associatedRole || null);

			if (isIdentical) {
				// Pretend we created it - return success with existing contact
				return NextResponse.json({
					success: true,
					contact: {
						id: existingContact.id,
						firstName: existingContact.firstName,
						lastName: existingContact.lastName,
						company: existingContact.company,
						title: existingContact.title,
						email: existingContact.email,
						phone: existingContact.phone,
						linkedIn: existingContact.linkedIn,
						importance: existingContact.importance,
						associatedRole: existingContact.associatedRole,
						createdAt: existingContact.createdAt.toISOString(),
						updatedAt: existingContact.updatedAt.toISOString(),
					},
				});
			}

			// Return duplicate data for comparison instead of error
			return NextResponse.json({
				success: false,
				duplicate: true,
				existingContact: {
					id: existingContact.id,
					firstName: existingContact.firstName,
					lastName: existingContact.lastName,
					company: existingContact.company,
					title: existingContact.title,
					email: existingContact.email,
					phone: existingContact.phone,
					linkedIn: existingContact.linkedIn,
					importance: existingContact.importance,
					associatedRole: existingContact.associatedRole,
				},
				submittedData: {
					firstName,
					lastName,
					company: company || null,
					title: title || null,
					email,
					phone: phone || null,
					linkedIn: linkedIn || null,
					importance: parseInt(importance),
					associatedRole: associatedRole || null,
				},
			});
		}

		// 6. Create contact in database
		const contact = await prisma.contact.create({
			data: {
				ownerId: user.id,
				firstName: firstName,
				lastName: lastName,
				company: company || null,
				title: title || null,
				email,
				phone: phone || null,
				linkedIn: linkedIn || null,
				importance: parseInt(importance),
				associatedRole: associatedRole || null,
			},
		});

		// 7. Return success response
		return NextResponse.json({
			success: true,
			contact,
		});
	} catch (error: any) {
		console.error('Contact creation error:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to create contact' },
			{ status: 500 }
		);
	}
}
