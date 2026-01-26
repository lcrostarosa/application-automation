import { NextRequest, NextResponse } from 'next/server';
import { sendGmail } from '@/lib/gmail';
import { prisma } from '@/lib/prisma';
import { parseSequenceData } from '@/lib/helperFunctions';

export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get('authorization');
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log(
			`[${new Date().toISOString()}] Cron: send-scheduled-messages started`
		);

		// Fetching all messages that are scheduled to be sent where scheduledAt is right now or in the past
		const messagesToSend = await prisma.message.findMany({
			where: {
				scheduledAt: { lte: new Date() },
				status: 'scheduled',
				sequence: {
					is: {
						active: true,
					},
				},
			},
			include: {
				contact: true,
				sequence: true,
			},
			take: 50,
		});

		if (!messagesToSend.length) {
			console.log('No messages to send');
			return NextResponse.json(
				{ message: 'No messages to send' },
				{ status: 200 }
			);
		}

		console.log(`Found ${messagesToSend.length} messages to send`);

		const results = await Promise.allSettled(
			messagesToSend.map(async (message) => {
				const contact = message.contact;
				const sequence = message.sequence;

				if (!sequence) {
					throw new Error('Sequence not found for message ' + message.id);
				}

				const endOfSequence =
					sequence.endDate &&
					sequence.nextStepDue &&
					sequence.nextStepDue > sequence.endDate;
				const passedApprovalDeadline =
					message.approvalDeadline && new Date() > message.approvalDeadline;
				const newCurrentStep = sequence.currentStep + 1;
				const { nextStepDueDate } = parseSequenceData(
					sequence.sequenceType,
					newCurrentStep,
					sequence.endDate
				);

				// If scheduled but not yet approved, and approval deadline not yet passed, skip sending
				if (
					message.status === 'scheduled' &&
					!message.approved &&
					!passedApprovalDeadline
				) {
					return {
						success: false,
						messageId: message.id,
						error: 'Approval pending',
					};
				}

				try {
					const result = await sendGmail({
						to: contact.email,
						subject: message.subject,
						html: endOfSequence ? 'Did I lose you?' : message.contents,
					});

					await prisma.$transaction([
						prisma.message.update({
							where: { id: message.id },
							data: {
								status: 'sent',
								messageId: result.messageId || null,
								needsFollowUp: !endOfSequence,
								nextMessageGenerated: false,
								sentAt: new Date(),
							},
						}),

						prisma.sequence.update({
							where: { id: sequence.id },
							data: {
								updatedAt: new Date(),
								nextStepDue: endOfSequence ? null : nextStepDueDate,
								currentStep: endOfSequence
									? sequence.currentStep
									: newCurrentStep,
								active: endOfSequence ? false : true,
							},
						}),

						prisma.contact.update({
							where: { id: contact.id },
							data: { lastActivity: new Date() },
						}),
					]);

					return { success: true, messageId: message.id };
				} catch (error) {
					console.error(`Error sending message ${message.id}:`, error);
					return {
						success: false,
						messageId: message.id,
						error: (error as Error).message,
					};
				}
			})
		);

		const succeeded = results.filter(
			(res) => res.status === 'fulfilled' && res.value.success
		).length;
		const failed = results.length - succeeded;

		console.log(
			`[${new Date().toISOString()}] Cron: generate-next-messages completed. Succeeded: ${succeeded}, Failed: ${failed}`
		);

		return NextResponse.json({
			success: true,
			processed: results.length,
			succeeded,
			failed,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error in send-scheduled-messages cron:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error', details: (error as Error).message },
			{ status: 500 }
		);
	}
}
