import { prisma } from '@/lib/prisma';

export async function findOrCreateContact(email: string, userId: number) {
	let contact = await prisma.contact.findFirst({
		where: {
			email: email,
			userId: userId,
		},
	});

	if (!contact) {
		contact = await prisma.contact.create({
			data: {
				email: email,
				userId: userId,
				firstName: null,
				lastName: null,
				company: null,
				autoCreated: true,
			},
		});
	}

	return contact;
}

export async function storeSentEmail({
	email,
	ownerId,
	subject,
	contents,
	messageId,
	threadId,
}: {
	email: string;
	ownerId: number;
	subject: string;
	contents: string;
	messageId: string;
	threadId: string;
}) {
	const contact = await findOrCreateContact(email, ownerId);

	return await prisma.message.create({
		data: {
			contactId: contact.id,
			ownerId,
			subject,
			contents,
			direction: 'outbound',
			messageId,
			threadId,
			date: new Date(),
		},
	});
}
