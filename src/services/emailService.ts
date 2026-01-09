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
	cadenceDuration,
	messageId,
	threadId,
	sequenceId,
}: StoredEmailData) {
	const contact = await findOrCreateContact(email, ownerId);

	// Declare variables for send delay and next step due date
	let sendDelay = null;
	let nextStepDueDate = null;

	const cadenceTypeMapping: { [key: string]: number } = {
		'1day': 1,
		'3day': 3,
		'31day': 31,
		weekly: 7,
		biweekly: 14,
		monthly: 28,
	};

	const cadenceDurationMapping: { [key: string]: number | null } = {
		'30': 30,
		'60': 60,
		'90': 90,
		indefinite: null,
	};

	// Check if user selected 'Review Before Sending' and set sendDelay accordingly
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

	// Handle sendDelay and nextStepDueDate calculation
	// if (sendDelay) {
	// If there's a send delay, set next step due date based on that
	// Process will look like: If there is a review before sending send delay, if the user reviews and clicks send, override the send delay and send immediately
	// Else: If the user does not review, email will automatically send after the delay time period has passed
	// }

	const endDate = cadenceDurationMapping[cadenceDuration]
		? new Date(
				Date.now() +
					cadenceDurationMapping[cadenceDuration] * 24 * 60 * 60 * 1000
		  )
		: null;

	// If sequenceId is provided, use existing sequence. Otherwise, create new one.

	if (sequenceId) {
		// Follow-up email: use existing sequence
		const sequence = await prisma.sequence.findUnique({
			where: { id: sequenceId },
		});

		if (!sequence) {
			throw new Error(`Sequence with id ${sequenceId} not found`);
		}

		// Calculate next step due date based on sequence type
		if (sequence.sequenceType === '31day') {
			const delay = sequence.currentStep % 2 === 0 ? 3 : 1;
			sequence.nextStepDue = new Date(Date.now() + delay * 24 * 60 * 60 * 1000);
		} else {
			sequence.nextStepDue = new Date(
				Date.now() +
					cadenceTypeMapping[sequence.sequenceType] * 24 * 60 * 60 * 1000
			);
		}

		const [createdMessage, updatedContact, updatedSequence] =
			await prisma.$transaction([
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
				prisma.sequence.update({
					where: { id: sequence.id },
					data: {
						nextStepDue: sequence.nextStepDue,
						currentStep: sequence.currentStep + 1,
					},
				}),
			]);

		return { createdMessage, updatedContact, updatedSequence };
	} else {
		// For 31day pattern, first step is always 3 days
		if (cadenceType === '31day') {
			nextStepDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
		} else {
			nextStepDueDate = new Date(
				Date.now() + cadenceTypeMapping[cadenceType] * 24 * 60 * 60 * 1000
			);
		}

		// First email: create new sequence
		const sequence = await prisma.sequence.create({
			data: {
				title: subject,
				contactId: contact.id,
				ownerId,
				sequenceType: cadenceType,
				autoSend: reviewBeforeSending ? false : true,
				autoSendDelay: sendDelay,
				sequenceDuration: cadenceDurationMapping[cadenceDuration],
				nextStepDue: nextStepDueDate,
				endDate,
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
}
