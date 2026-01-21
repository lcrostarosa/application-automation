import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

// Services imports
import { getApiUser } from './getUserService';

export async function getSequencesByContactId(contactId: number) {
	const { user, error } = await getApiUser();
	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		redirect('/');
	}

	const sequences = await prisma.sequence.findMany({
		where: { ownerId: user.id, contactId: contactId },
		include: {
			messages: {
				orderBy: { createdAt: 'desc' },
			},
			emailReplies: {
				orderBy: { replyDate: 'desc' },
			},
		},
		orderBy: { createdAt: 'desc' },
	});

	return { sequences };
}

export async function getSequenceById(sequenceId: number) {
	const { user, error } = await getApiUser();

	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		redirect('/');
	}

	const sequence = await prisma.sequence.findFirst({
		where: { ownerId: user.id, id: sequenceId },
		include: {
			messages: {
				orderBy: { createdAt: 'desc' },
			},
			emailReplies: {
				orderBy: { replyDate: 'desc' },
			},
		},
	});

	return sequence;
}

export async function deactivateSequence(sequenceId: number) {
	const { user, error } = await getApiUser();

	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		redirect('/');
	}

	await prisma.sequence.update({
		where: { ownerId: user.id, id: sequenceId },
		data: { active: false, endDate: new Date() },
	});

	await prisma.message.updateMany({
		where: { sequenceId: sequenceId, status: { in: ['pending', 'scheduled'] } },
		data: { status: 'cancelled' },
	});
}
