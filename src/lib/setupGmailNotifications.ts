import { prisma } from '@/lib/prisma';
import { getGmailClientForUser } from '@/lib/gmailClientFactory';
import { gmail_v1 } from 'googleapis';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID!;

interface SetupResult {
	userId: number;
	success: boolean;
	data?: gmail_v1.Schema$WatchResponse;
	error?: string;
}

/**
 * Sets up Gmail push notifications (watch) for a specific user
 * @param userId The user's ID
 * @returns Watch result data including historyId and expiration
 */
export async function setupGmailNotificationsForUser(userId: number) {
	const { gmail, credentialId } = await getGmailClientForUser(userId);

	const result = await gmail.users.watch({
		userId: 'me',
		requestBody: {
			topicName: `projects/${PROJECT_ID}/topics/gmail-notifications`,
			labelIds: ['INBOX'],
		},
	});

	// Store the watch expiration and history ID in the credential record
	await prisma.userGmailCredential.update({
		where: { id: credentialId },
		data: {
			watchExpiration: result.data.expiration
				? new Date(parseInt(result.data.expiration))
				: null,
			lastHistoryId: result.data.historyId || null,
		},
	});

	console.log(`Gmail notifications setup for user ${userId}:`, result.data);
	return result.data;
}

/**
 * Sets up Gmail notifications for all users with valid credentials
 * Useful for cron-based renewal of watches that expire after ~7 days
 */
export async function setupGmailNotificationsForAllUsers() {
	const credentials = await prisma.userGmailCredential.findMany({
		where: { isValid: true },
		select: { userId: true, gmailAddress: true },
	});

	const results = await Promise.allSettled(
		credentials.map(
			async (cred: { userId: number; gmailAddress: string }): Promise<SetupResult> => {
				try {
					const data = await setupGmailNotificationsForUser(cred.userId);
					return { userId: cred.userId, success: true, data };
				} catch (error) {
					console.error(
						`Failed to setup notifications for user ${cred.userId}:`,
						error
					);
					return {
						userId: cred.userId,
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
					};
				}
			}
		)
	);

	const succeeded = results.filter(
		(r: PromiseSettledResult<SetupResult>) =>
			r.status === 'fulfilled' && r.value.success
	).length;
	const failed = results.length - succeeded;

	console.log(
		`Gmail notifications renewal: ${succeeded} succeeded, ${failed} failed`
	);

	return {
		total: results.length,
		succeeded,
		failed,
		results: results.map((r: PromiseSettledResult<SetupResult>) =>
			r.status === 'fulfilled' ? r.value : { error: String(r.reason) }
		),
	};
}

/**
 * Stops Gmail notifications for a specific user
 * @param userId The user's ID
 */
export async function stopGmailNotificationsForUser(userId: number) {
	const { gmail, credentialId } = await getGmailClientForUser(userId);

	await gmail.users.stop({ userId: 'me' });

	// Clear the watch expiration
	await prisma.userGmailCredential.update({
		where: { id: credentialId },
		data: {
			watchExpiration: null,
		},
	});

	console.log(`Gmail notifications stopped for user ${userId}`);
}

/**
 * Gets credentials that need watch renewal (expiring within 24 hours)
 */
export async function getCredentialsNeedingRenewal() {
	const renewalThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

	return prisma.userGmailCredential.findMany({
		where: {
			isValid: true,
			OR: [
				{ watchExpiration: null },
				{ watchExpiration: { lt: renewalThreshold } },
			],
		},
		select: {
			userId: true,
			gmailAddress: true,
			watchExpiration: true,
		},
	});
}

// Legacy export for backwards compatibility during migration
export { setupGmailNotificationsForUser as setupGmailNotifications };
