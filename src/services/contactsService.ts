// Library imports
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

// Services imports
import { getApiUser } from './getUserService';

export async function getAllContacts() {
	const { user, error } = await getApiUser();
	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		redirect('/');
	}

	const contacts = await prisma.contact.findMany({
		where: { ownerId: user.id },
	});

	return contacts;
}

export async function getContactById(contactId: number) {
	const { user, error } = await getApiUser();
	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		redirect('/');
	}

	const contact = await prisma.contact.findFirst({
		where: { ownerId: user.id, id: contactId },
	});

	return contact;
}
