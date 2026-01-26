import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function runUpdatePendingMessages({ limit }: { limit: number }) {
	const limitValue = limit || 50;

	console.log(
		`[${new Date().toISOString()}] Cron: update-pending-messages started`
	);

	// Fetching all messages that are pending, need approval, are scheduled to be sent where scheduledAt is right now or in the past, and sequence is still active
	const candidates = await prisma.message.findMany({
		where: {
			status: 'pending',
			needsApproval: true,
			scheduledAt: { lte: new Date() },
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
		console.log('No messages to update');
		return { success: true, processed: 0, message: 'No messages to update' };
	}

	const candidateIds = candidates.map((msg) => msg.id);

	console.log(`Found ${candidates.length} messages to update`);

	const claimResult = await prisma.message.updateMany({
		where: {
			id: { in: candidateIds },
			status: 'pending',
		},
		data: { status: 'processing' },
	});

	if (!claimResult.count) {
		console.log('No messages were claimed for processing');
		return {
			success: true,
			processed: 0,
			message: 'No messages were claimed for processing',
		};
	}

	const messagesToUpdate = await prisma.message.findMany({
		where: {
			id: { in: candidateIds },
			status: 'processing',
		},
		include: {
			contact: true,
			sequence: true,
		},
	});

	if (!messagesToUpdate.length) {
		console.log('No messages to update');
		return { success: true, processed: 0, message: 'No messages to update' };
	}

	console.log(`Found ${messagesToUpdate.length} messages to update`);

	const results = await Promise.allSettled(
		messagesToUpdate.map(async (message) => {
			const sequence = message.sequence;

			if (!sequence) {
				throw new Error('Sequence not found for message ' + message.id);
			}

			try {
				await prisma.message.update({
					where: { id: message.id },
					data: {
						status: 'scheduled',
					},
				});

				return { success: true, messageId: message.id };
			} catch (error) {
				console.error(`Error updating message ${message.id}:`, error);
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
		`[${new Date().toISOString()}] Cron: update-pending-messages completed. Succeeded: ${succeeded}, Failed: ${failed}`
	);

	return {
		success: true,
		processed: results.length,
		succeeded,
		failed,
		timestamp: new Date().toISOString(),
	};
}
