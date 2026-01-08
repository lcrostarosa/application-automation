import { NextRequest, NextResponse } from 'next/server';
import { sendGmail } from '@/lib/gmail';
import { storeSentEmail } from '@/services/emailService';
import { getApiUser } from '@/services/getUserService';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
	try {
		const { user, error } = await getApiUser();
		if (error) {
			return NextResponse.json(
				{ error: error.error },
				{ status: error.status }
			);
		}

		const {
			to,
			subject,
			reviewBeforeSending,
			cadenceType,
			sendWithoutReviewAfter,
			cadenceDuration,
			body,
			override,
			sequenceId,
		} = await req.json();

		if (
			!to ||
			!subject ||
			!body ||
			(reviewBeforeSending === true && !sendWithoutReviewAfter) ||
			!cadenceType
		) {
			return NextResponse.json(
				{ error: 'Missing parameters' },
				{ status: 400 }
			);
		}

		// Helper: deactivate sequence
		const deactivateSequence = async () => {
			const existingSequence = await prisma.sequence.findFirst({
				where: { contact: { email: to }, ownerId: user.id, active: true },
			});

			if (existingSequence) {
				await prisma.sequence.update({
					where: { id: existingSequence.id },
					data: { active: false, endDate: new Date() },
				});
			}
		};

		// Helper: send email and update contact
		const sendAndStoreEmail = async () => {
			const result = await sendGmail({ to, subject, html: body });

			if (user && result.messageId && result.threadId) {
				const { updatedContact } = await storeSentEmail({
					email: to,
					ownerId: user.id,
					subject,
					contents: body,
					cadenceType,
					reviewBeforeSending,
					sendWithoutReviewAfter,
					cadenceDuration,
					messageId: result.messageId,
					threadId: result.threadId,
				});

				return NextResponse.json({
					success: true,
					messageId: result.messageId,
					threadId: result.threadId,
					contact: updatedContact,
				});
			}

			return NextResponse.json(
				{ error: 'Failed to send email or create message.' },
				{ status: 500 }
			);
		};

		// Handle override: true logic
		if (override) {
			await deactivateSequence();
			return await sendAndStoreEmail();
		}

		// Check if user has an existing sequence, if it matches the sequenceId passed in, or not
		const existingSequence = await prisma.sequence.findFirst({
			where: {
				contact: {
					email: to,
				},
				ownerId: user.id,
				active: true,
			},
		});

		if (!existingSequence) {
			return await sendAndStoreEmail();
		}

		const matches = sequenceId && existingSequence.id === sequenceId;

		if (!matches) {
			return NextResponse.json(
				{
					sequenceExists: true,
					activeSequenceId: existingSequence.id,
					emailData: {
						to,
						subject,
						reviewBeforeSending,
						cadenceType,
						sendWithoutReviewAfter,
						cadenceDuration,
						body,
					},
					message: 'Contact already part of an active sequence.',
				},
				{ status: 409 }
			);
		}

		return await sendAndStoreEmail();
	} catch (error: any) {
		console.error('Email send error:', error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
