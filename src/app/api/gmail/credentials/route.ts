import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/services/getUserService';
import { prisma } from '@/lib/prisma';
import { getGmailCredentialStatus } from '@/lib/gmailClientFactory';
import { stopGmailNotificationsForUser } from '@/lib/setupGmailNotifications';

/**
 * GET /api/gmail/credentials
 * Returns the current user's Gmail credential status
 */
export async function GET(_req: NextRequest) {
	try {
		const { user, error } = await getApiUser();
		if (error) {
			return NextResponse.json({ error: error.error }, { status: error.status });
		}

		const credential = await getGmailCredentialStatus(user.id);

		if (!credential) {
			return NextResponse.json({
				configured: false,
				message: 'Gmail credentials not configured',
			});
		}

		return NextResponse.json({
			configured: true,
			gmailAddress: credential.gmailAddress,
			isValid: credential.isValid,
			lastValidatedAt: credential.lastValidatedAt,
			lastError: credential.lastError,
			watchExpiration: credential.watchExpiration,
			createdAt: credential.createdAt,
			updatedAt: credential.updatedAt,
		});
	} catch (error) {
		console.error('Error fetching Gmail credentials:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

/**
 * DELETE /api/gmail/credentials
 * Removes the current user's Gmail credentials
 */
export async function DELETE(_req: NextRequest) {
	try {
		const { user, error } = await getApiUser();
		if (error) {
			return NextResponse.json({ error: error.error }, { status: error.status });
		}

		const credential = await prisma.userGmailCredential.findUnique({
			where: { userId: user.id },
		});

		if (!credential) {
			return NextResponse.json(
				{ error: 'No Gmail credentials found' },
				{ status: 404 }
			);
		}

		// Stop Gmail watch notifications before deleting
		try {
			await stopGmailNotificationsForUser(user.id);
		} catch (stopError) {
			// Log but don't fail - credentials may already be invalid
			console.warn('Failed to stop Gmail notifications:', stopError);
		}

		// Delete the credential
		await prisma.userGmailCredential.delete({
			where: { userId: user.id },
		});

		return NextResponse.json({
			success: true,
			message: 'Gmail credentials removed',
		});
	} catch (error) {
		console.error('Error deleting Gmail credentials:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
