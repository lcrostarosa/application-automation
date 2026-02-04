import { sendGmail, GmailCredentialError } from '@/lib/gmail';
import { prisma } from '@/lib/prisma';
import { parseSequenceData } from '@/lib/helperFunctions';
import { getGmailCredentialStatus } from '@/lib/gmailClientFactory';

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

	const candidateIds = candidates.map((c: { id: number }) => c.id);

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
		messagesToSend.map(async (message: typeof messagesToSend[0]) => {
			const now = new Date();

			// If message requires approval and is not approved, skip if there's no deadline (wait indefinitely) or if there's a future approvalDeadline
			if (message.needsApproval && !message.approved) {
				const shouldSkip =
					!message.approvalDeadline ||
					(message.approvalDeadline && now < message.approvalDeadline);

				if (shouldSkip) {
					await prisma.message.update({
						where: { id: message.id },
						data: { status: 'scheduled' },
					});
					return {
						success: false,
						messageId: message.id,
						error: 'Approval pending',
					};
				}
			}

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

			// Pre-check: Verify user has valid Gmail credentials
			const credentialStatus = await getGmailCredentialStatus(message.ownerId);
			if (!credentialStatus) {
				console.error(
					`No Gmail credentials for user ${message.ownerId}, marking message as failed`
				);
				await prisma.message.update({
					where: { id: message.id },
					data: {
						status: 'failed',
						lastError: 'Gmail credentials not configured',
					},
				});
				return {
					success: false,
					messageId: message.id,
					error: 'Gmail credentials not configured',
				};
			}

			if (!credentialStatus.isValid) {
				console.error(
					`Invalid Gmail credentials for user ${message.ownerId}, marking message as failed`
				);
				await prisma.message.update({
					where: { id: message.id },
					data: {
						status: 'failed',
						lastError: `Gmail credentials invalid: ${credentialStatus.lastError}`,
					},
				});
				return {
					success: false,
					messageId: message.id,
					error: `Gmail credentials invalid: ${credentialStatus.lastError}`,
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
					userId: message.ownerId,
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
							lastError: null,
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

				// Handle credential errors - mark as failed instead of retrying
				if (error instanceof GmailCredentialError) {
					await prisma.message.update({
						where: { id: message.id },
						data: {
							status: 'failed',
							lastError: error.message,
						},
					});
					return {
						success: false,
						messageId: message.id,
						error: error.message,
					};
				}

				// For other errors, restore to scheduled so it can be retried later
				await prisma.message.update({
					where: { id: message.id },
					data: {
						status: 'scheduled',
						sendAttempts: { increment: 1 },
						lastError: (error as Error).message,
					},
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
		(res: PromiseSettledResult<{ success: boolean; messageId: number; error?: string }>) =>
			res.status === 'fulfilled' && res.value.success
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
