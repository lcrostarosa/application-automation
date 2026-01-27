import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser } from '@/services/getUserService';
import { generateMessage } from '@/services/messageGenerationService';

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { user, error } = await getApiUser();

	if (error) {
		return NextResponse.json({ error: error.error }, { status: error.status });
	}

	const { id } = await params;
	const messageId = parseInt(id);

	if (Number.isNaN(messageId)) {
		return NextResponse.json({ error: 'invalid message id' }, { status: 400 });
	}

	console.log(`[${new Date().toISOString()}] Generate next message started`);

	const candidate = await prisma.message.findFirst({
		where: {
			id: messageId,
			needsFollowUp: true,
			nextMessageGenerated: false,
			status: 'sent',
			sequenceId: { not: null },
		},
		include: {
			contact: true,
			sequence: true,
		},
	});

	if (!candidate) {
		console.log('No new message to process');
		return NextResponse.json({
			success: true,
			processed: 0,
			message: 'No new message to process',
		});
	}

	const candidateId = candidate.id;

	console.log(`Found 1 message to process:`, candidateId);

	const claimResult = await prisma.message.updateMany({
		where: {
			id: candidateId,
			status: 'sent',
			nextMessageGenerated: false,
		},
		data: { status: 'processing' },
	});

	if (!claimResult.count) {
		console.log('No messages claimed for processing');
		return NextResponse.json({
			success: true,
			processed: 0,
			message: 'No messages claimed for processing',
		});
	}

	const messageToProcess = await prisma.message.findFirst({
		where: {
			id: candidateId,
			status: 'processing',
		},
		include: {
			contact: true,
			sequence: true,
		},
	});

	if (!messageToProcess) {
		console.log('No messages to process');
		return NextResponse.json({
			success: true,
			processed: 0,
			message: 'No messages to process',
		});
	}

	console.log(`Found 1 message to process:`, messageToProcess.id);

	const result = await (async () => {
		const sequence = messageToProcess.sequence;
		const contact = messageToProcess.contact;

		try {
			// Checking if sequence is still active
			if (!sequence || !sequence.active) {
				console.log(
					`Skipping message ${messageToProcess.id} - sequence inactive`
				);
				//Mark as processed so not included in next processing
				await prisma.message.update({
					where: { id: messageToProcess.id },
					data: { nextMessageGenerated: true },
				});
				return { success: true, messageId: messageToProcess.id, skipped: true };
			}
		} catch (error) {
			console.error(`Error processing message ${messageToProcess.id}:`, error);
			return {
				success: false,
				messageId: messageToProcess.id,
				error: (error as Error).message,
			};
		}

		try {
			// Generate the next message
			const generatedMessage = await generateMessage(
				{
					contactName: contact.firstName || null,
					previousSubject: messageToProcess.subject,
					previousBody: messageToProcess.contents,
				},
				{
					keepSubject: !sequence.alterSubjectLine,
					preserveThreadContext: sequence.referencePreviousEmail ?? true,
				}
			);

			const scheduledAt = sequence.nextStepDue || null;

			if (!scheduledAt) {
				console.log(
					`No scheduled time for next message in sequence ${sequence.id} for message ${messageToProcess.id}`
				);
				return {
					success: false,
					messageId: messageToProcess.id,
					error: 'No scheduled time',
				};
			}

			const approvalDeadline = sequence.autoSendDelay
				? new Date(
						scheduledAt.getTime() + sequence.autoSendDelay * 24 * 60 * 60 * 1000
				  )
				: null;

			// Store the next message
			await prisma.$transaction([
				prisma.message.create({
					data: {
						contactId: messageToProcess.contactId,
						ownerId: messageToProcess.ownerId,
						sequenceId: messageToProcess.sequenceId,
						subject: generatedMessage.subject,
						contents: generatedMessage.bodyHtml,
						direction: 'outbound',
						createdAt: new Date(),
						inReplyTo: messageToProcess.messageId,
						needsApproval: !sequence.autoSend,
						approved: !sequence.autoSend ? false : null,
						approvalDeadline: approvalDeadline,
						scheduledAt: scheduledAt,
						status: sequence.autoSend ? 'scheduled' : 'pending',
						needsFollowUp: false,
						nextMessageGenerated: false,
						threadId: messageToProcess.threadId,
					},
				}),

				prisma.message.update({
					where: { id: messageToProcess.id },
					data: {
						nextMessageGenerated: true,
						needsFollowUp: false,
						status: 'sent',
					},
				}),
			]);

			console.log(
				`Follow-up message created for message ${messageToProcess.id}`
			);

			return {
				success: true,
				messageId: messageToProcess.id,
				contactId: contact.id,
			};
		} catch (error) {
			console.error(`Error processing message ${messageToProcess.id}:`, error);
			return {
				success: false,
				messageId: messageToProcess.id,
				error: (error as Error).message,
			};
		}
	})();

	console.log(
		`[${new Date().toISOString()}] Trigger: generate-next-message completed.`
	);

	return NextResponse.json({
		success: true,
		processed: result ? 1 : 0,
		timestamp: new Date().toISOString(),
		result,
	});
}
