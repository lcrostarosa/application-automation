import { prisma } from '@/lib/prisma';

// Services imports
import { getApiUser } from './getUserService';
import { generateMessage } from './messageGenerationService';
import { sendGmail } from '@/lib/gmail';

// Types imports
import { ContactFromDB } from '@/types/contactTypes';
import { SequenceFromDB } from '@/types/sequenceTypes';

export async function getAllMessagesByUserId() {
	const { user, error } = await getApiUser();

	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		return { messages: [] };
	}

	const messages = await prisma.message.findMany({
		where: { ownerId: user.id },
		orderBy: { createdAt: 'desc' },
	});

	return { messages };
}

export async function getAllPendingMessages() {
	const { user, error } = await getApiUser();

	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		return { messages: [] };
	}

	const messages = await prisma.message.findMany({
		where: { ownerId: user.id, status: { in: ['pending', 'scheduled'] } },
		orderBy: { createdAt: 'desc' },
	});

	return { messages };
}

export async function getAllMessagesByContactId(contactId: number) {
	const { user, error } = await getApiUser();

	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		return { messages: [] };
	}

	const messages = await prisma.message.findMany({
		where: { ownerId: user.id, contactId: contactId },
		orderBy: { createdAt: 'desc' },
	});

	return { messages };
}

export async function getStandaloneMessagesByContactId(contactId: number) {
	const { user, error } = await getApiUser();

	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		return { messages: [] };
	}

	const messages = await prisma.message.findMany({
		where: { ownerId: user.id, contactId: contactId, sequenceId: null },
		orderBy: { createdAt: 'desc' },
	});

	return { messages };
}
