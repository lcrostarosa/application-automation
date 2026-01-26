import { sendGmail } from '@/lib/gmail';
import { prisma } from '@/lib/prisma';
import { parseSequenceData } from '@/lib/helperFunctions';

export async function runSendScheduledMessages({ limit }: { limit: number }) {
	const limitValue = limit || 50;

	console.log(
		`[${new Date().toISOString()}] Cron: send-scheduled-messages started`
	);

	// Fetching all messages that are scheduled to be sent where scheduledAt is right now or in the past
	const candidates = await prisma.message.findMany({
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
		take: limitValue,
	});

	if (!candidates.length) {
		console.log('No messages to send');
		return {
			success: true,
			processed: 0,
			message: 'No messages to send',
		};
	}

	const candidateIds = candidates.map((c) => c.id);

	console.log(`Found ${candidates.length} messages to send`);

	const claimResult = await prisma.message.updateMany({
		where: { id: { in: candidateIds }, status: 'scheduled' },
		data: { status: 'processing' }, // assumes 'processing' is a valid status value
	});

	if (!claimResult.count) {
		console.log('No messages claimed (another cron may have taken them)');
		return {
			success: true,
			processed: 0,
			message: 'No messages claimed (another cron may have taken them)',
		};
	}

	const messagesToSend = await prisma.message.findMany({
		where: { id: { in: candidateIds }, status: 'processing' },
		include: { contact: true, sequence: true },
	});

	const results = await Promise.allSettled(
		messagesToSend.map(async (message) => {
			const contact = message.contact;
			const sequence = message.sequence;

			if (!sequence) {
				await prisma.message.update({
					where: { id: message.id },
					data: { status: 'scheduled' },
				});
				return {
					success: false,
					messageId: message.id,
					error: 'Sequence not found',
				};
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
				// restore to scheduled so it can be retried later
				await prisma.message.update({
					where: { id: message.id },
					data: { status: 'scheduled' },
				});
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
		`[${new Date().toISOString()}] Cron: send-scheduled-messages completed. Succeeded: ${succeeded}, Failed: ${failed}`
	);

	return {
		success: true,
		processed: results.length,
		succeeded,
		failed,
		timestamp: new Date().toISOString(),
	};
}
