import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/services/getUserService';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { auditUserAction, AUDIT_ACTIONS } from '@/lib/audit';

export async function GET(_req: NextRequest) {
	try {
		// 1. Check authentication
		const { user, error } = await getApiUser();
		if (error) {
			return NextResponse.json(
				{ error: error.error },
				{ status: error.status }
			);
		}

		// 3. Fetch contacts for the user
		const contacts = await prisma.contact.findMany({
			where: { ownerId: user.id },
		});

		// 4. Return contacts
		return NextResponse.json({ contacts });
	} catch (error: unknown) {
		console.error('Error fetching contacts:', error);
		const message = error instanceof Error ? error.message : 'Failed to fetch contacts';
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
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
		const rateLimit = checkRateLimit(String(user.id), 'api');
		if (!rateLimit.allowed) {
			await auditUserAction(
				req,
				user.id,
				AUDIT_ACTIONS.RATE_LIMITED,
				'contact',
				null,
				{ endpoint: 'contacts' },
				'failure',
				'Rate limit exceeded'
			);
			return NextResponse.json(
				{ error: 'Too many requests. Please try again later.' },
				{ status: 429, headers: rateLimit.headers }
			);
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
			reasonForEmail,
		} = await req.json();

		// 4. Validate required fields
		if (!firstName || !lastName || !email) {
			return NextResponse.json(
				{ error: 'Missing required fields: firstName, lastName, email' },
				{ status: 400, headers: rateLimit.headers }
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
				existingContact.reasonForEmail === (reasonForEmail || null);

			if (isIdentical) {
				// Pretend we created it - return success with existing contact
				return NextResponse.json(
					{
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
							reasonForEmail: existingContact.reasonForEmail,
							createdAt: existingContact.createdAt.toISOString(),
							updatedAt: existingContact.updatedAt.toISOString(),
						},
					},
					{ headers: rateLimit.headers }
				);
			}

			// Return duplicate data for comparison instead of error
			return NextResponse.json(
				{
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
						reasonForEmail: existingContact.reasonForEmail,
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
						reasonForEmail: reasonForEmail || null,
					},
				},
				{ headers: rateLimit.headers }
			);
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
				reasonForEmail: reasonForEmail || null,
			},
		});

		// 7. Audit the contact creation
		await auditUserAction(
			req,
			user.id,
			AUDIT_ACTIONS.CONTACT_CREATE,
			'contact',
			contact.id,
			{ email, firstName, lastName, company },
			'success'
		);

		// 8. Return success response
		return NextResponse.json(
			{
				success: true,
				contact,
			},
			{ headers: rateLimit.headers }
		);
	} catch (error: unknown) {
		console.error('Contact creation error:', error);
		const message = error instanceof Error ? error.message : 'Failed to create contact';
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
