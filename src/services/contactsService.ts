// Library imports
import { auth0 } from '@/lib/auth0';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function getAllContacts() {
	const session = await auth0.getSession();

	if (!session?.user) {
		console.error('No user session found, redirecting to home page.');
		redirect('/');
	}

	const user = await prisma.user.findUnique({
		where: { auth0Id: session.user.sub },
	});

	const contacts = await prisma.contact.findMany({
		where: { ownerId: user?.id },
	});

	return contacts;
}

export async function getContactById(contactId: number) {
	const session = await auth0.getSession();

	if (!session?.user) {
		console.error('No user session found, redirecting to home page.');
		redirect('/');
	}

	const user = await prisma.user.findUnique({
		where: { auth0Id: session.user.sub },
	});

	const contact = await prisma.contact.findFirst({
		where: { ownerId: user?.id, id: contactId },
	});

	return contact;
}
