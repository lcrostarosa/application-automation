import { prisma } from '@/lib/prisma';

// Types imports
import { StoredEmailData } from '@/types/emailTypes';

export async function findOrCreateContact(email: string, ownerId: number) {
	let contact = await prisma.contact.findFirst({
		where: {
			email: email,
			ownerId: ownerId,
		},
	});

	if (!contact) {
		contact = await prisma.contact.create({
			data: {
				email: email,
				ownerId: ownerId,
				firstName: null,
				lastName: null,
				company: null,
				autoCreated: true,
				active: true,
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
	cadenceType,
	reviewBeforeSending,
	sendWithoutReviewAfter,
	messageId,
	threadId,
}: StoredEmailData) {
	const contact = await findOrCreateContact(email, ownerId);

	let sendDelay = null;
	let nextStepDueDate = null;

	if (
		sendWithoutReviewAfter === 'never' ||
		sendWithoutReviewAfter === '' ||
		!reviewBeforeSending
	) {
		sendDelay = null;
	} else {
		sendDelay = sendWithoutReviewAfter
			? parseInt(sendWithoutReviewAfter)
			: null;
	}

	if (sendDelay) {
		nextStepDueDate = new Date(Date.now() + sendDelay * 24 * 60 * 60 * 1000);
	}

	const sequence = await prisma.sequence.create({
		data: {
			contactId: contact.id,
			ownerId,
			sequenceType: cadenceType,
			autoSend: reviewBeforeSending,
			autoSendDelay: sendDelay,
			nextStepDue: nextStepDueDate,
		},
	});

	// Transaction safety: create message in transaction
	const [createdMessage, updatedContact] = await prisma.$transaction([
		prisma.message.create({
			data: {
				contactId: contact.id,
				ownerId,
				sequenceId: sequence.id,
				subject,
				contents,
				direction: 'outbound',
				messageId,
				threadId,
				date: new Date(),
			},
		}),
		prisma.contact.update({
			where: { id: contact.id },
			data: { lastActivity: new Date(), active: true },
		}),
	]);

	return { createdMessage, updatedContact };
}
