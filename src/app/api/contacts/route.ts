import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';

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
			first,
			last,
			company,
			title,
			email,
			phone,
			linkedin,
			importance,
			associatedRole,
		} = await req.json();

		// 4. Validate required fields
		if (!first || !last || !email || !importance) {
			return NextResponse.json(
				{ error: 'Missing required fields: first, last, email, importance' },
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
			return NextResponse.json(
				{ error: 'Contact with this email already exists' },
				{ status: 409 }
			);
		}

		// 6. Create contact in database
		const contact = await prisma.contact.create({
			data: {
				ownerId: user.id,
				firstName: first,
				lastName: last,
				company: company || null,
				title: title || null,
				email,
				phone: phone || null,
				linkedIn: linkedin || null,
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
