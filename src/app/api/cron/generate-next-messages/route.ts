import { NextRequest, NextResponse } from 'next/server';
import { generateMessage } from '@/services/messageGenerationService';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get('authorization');
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log(
			`[${new Date().toISOString()}] Cron: generate-next-messages started`
		);

		const candidates = await prisma.message.findMany({
			where: {
				needsFollowUp: true,
				nextMessageGenerated: false,
				status: 'sent',
				sequenceId: { not: null },
			},
			include: {
				contact: true,
				sequence: true,
			},
			take: 50,
		});

		if (!candidates.length) {
			console.log('No messages to process');
			return NextResponse.json(
				{ message: 'No messages to process' },
				{ status: 200 }
			);
		}

		const candidateIds = candidates.map((msg) => msg.id);
		console.log(
			`Found ${candidates.length} messages to process:`,
			candidateIds
		);

		const claimResult = await prisma.message.updateMany({
			where: {
				id: { in: candidateIds },
				status: 'sent',
				nextMessageGenerated: false,
			},
			data: { status: 'processing' },
		});

		if (!claimResult.count) {
			console.log('No messages claimed for processing');
			return NextResponse.json(
				{ message: 'No messages claimed for processing' },
				{ status: 200 }
			);
		}

		const messagesToProcess = await prisma.message.findMany({
			where: {
				id: { in: candidateIds },
				status: 'processing',
			},
			include: {
				contact: true,
				sequence: true,
			},
		});

		if (!messagesToProcess.length) {
			console.log('No messages to process');
			return NextResponse.json(
				{ message: 'No messages to process' },
				{ status: 200 }
			);
		}

		console.log(`Found ${messagesToProcess.length} messages to process`);

		const results = await Promise.allSettled(
			messagesToProcess.map(async (message) => {
				const sequence = message.sequence;
				const contact = message.contact;

				try {
					// Checking if sequence is still active
					if (!sequence || !sequence.active) {
						console.log(`Skipping message ${message.id} - sequence inactive`);

						//Mark as processed so not included in next processing
						await prisma.message.update({
							where: { id: message.id },
							data: { nextMessageGenerated: true },
						});
						return { success: true, messageId: message.id, skipped: true };
					}
				} catch (error) {
					console.error(`Error processing message ${message.id}:`, error);
					return {
						success: false,
						messageId: message.id,
						error: (error as Error).message,
					};
				}

				try {
					// Generate the next message
					const generatedMessage = await generateMessage(
						{
							contactName: contact.firstName || null,
							previousSubject: message.subject,
							previousBody: message.contents,
						},
						{
							keepSubject: !sequence.alterSubjectLine,
							preserveThreadContext: sequence.referencePreviousEmail ?? true,
						}
					);

					const scheduledAt = sequence.nextStepDue || null;

					const approvalDeadline = sequence.autoSendDelay
						? new Date(
								Date.now() + sequence.autoSendDelay * 24 * 60 * 60 * 1000
						  )
						: null;

					// Store the next message
					await prisma.message.create({
						data: {
							contactId: message.contactId,
							ownerId: message.ownerId,
							sequenceId: message.sequenceId,
							subject: generatedMessage.subject,
							contents: generatedMessage.bodyHtml,
							direction: 'outbound',
							createdAt: new Date(),
							inReplyTo: message.messageId,
							needsApproval: !sequence.autoSend,
							approved: !sequence.autoSend ? false : null,
							approvalDeadline: approvalDeadline,
							scheduledAt: scheduledAt,
							status: sequence.autoSend ? 'scheduled' : 'pending',
							needsFollowUp: false,
							nextMessageGenerated: false,
							threadId: message.threadId,
						},
					});

					await prisma.message.update({
						where: { id: message.id },
						data: {
							nextMessageGenerated: true,
							needsFollowUp: false,
							status: 'sent',
						},
					});

					console.log(`Follow-up message created for message ${message.id}`);

					return { success: true, messageId: message.id };
				} catch (error) {
					console.error(`Error processing message ${message.id}:`, error);
					return {
						success: false,
						messageId: message.id,
						error: (error as Error).message,
					};
				}
			})
		);

		const succeeded = results.filter(
			(result) => result.status === 'fulfilled' && result.value.success
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
	} catch (error: unknown) {
		console.error('Error in generate-next-messages cron:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json(
			{ error: 'Internal Server Error', details: message },
			{ status: 500 }
		);
	}
}
