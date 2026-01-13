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
	inReplyTo,
	sequenceId,
}: StoredEmailData) {
	const contact = await findOrCreateContact(email, ownerId);

	const cadenceTypeMapping: { [key: string]: number } = {
		'1day': 1,
		'3day': 3,
		'31day': 31,
		weekly: 7,
		biweekly: 14,
		monthly: 28,
		none: 0,
	};

	const cadenceDurationMapping: { [key: string]: number | null } = {
		'30': 30,
		'60': 60,
		'90': 90,
		indefinite: null,
	};

	// Send delay in days
	const sendDelay =
		sendWithoutReviewAfter === 'never' ||
		sendWithoutReviewAfter === '' ||
		!reviewBeforeSending
			? null
			: sendWithoutReviewAfter
			? parseInt(sendWithoutReviewAfter)
			: null;

	const sequenceDuration = cadenceDurationMapping[cadenceDuration];

	const endDate = sequenceDuration
		? new Date(Date.now() + sequenceDuration * 24 * 60 * 60 * 1000)
		: null;

	// If cadenceType is 'none', no follow-up emails
	if (cadenceType === 'none') {
		const [createdMessage, updatedContact] = await prisma.$transaction([
			prisma.message.create({
				data: {
					contactId: contact.id,
					ownerId,
					subject,
					contents,
					direction: 'outbound',
					messageId,
					threadId,
					inReplyTo: inReplyTo || null,
					createdAt: new Date(),
					status: 'sent',
				},
			}),
			prisma.contact.update({
				where: { id: contact.id },
				data: { lastActivity: new Date() },
			}),
		]);
		return { createdMessage, updatedContact };
	}

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
			const sequenceDelay = cadenceTypeMapping[sequence.sequenceType];
			const nextStepDueDate = new Date(
				Date.now() + sequenceDelay * 24 * 60 * 60 * 1000
			);

			sequence.endDate && nextStepDueDate > sequence.endDate
				? (sequence.nextStepDue = null)
				: (sequence.nextStepDue = nextStepDueDate);
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
						inReplyTo: inReplyTo || null,
						createdAt: new Date(),
						status: reviewBeforeSending ? 'pending' : 'sent',
						needsApproval: reviewBeforeSending,
						approvalDeadline:
							reviewBeforeSending && sendDelay
								? new Date(Date.now() + sendDelay * 60 * 1000)
								: null,
					},
				}),
				prisma.contact.update({
					where: { id: contact.id },
					data: { lastActivity: new Date() },
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
		const nextStepDueDate =
			cadenceType === '31day'
				? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
				: new Date(
						Date.now() + cadenceTypeMapping[cadenceType] * 24 * 60 * 60 * 1000
				  );

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
					inReplyTo: inReplyTo || null,
					createdAt: new Date(),
					needsApproval: reviewBeforeSending,
					status: reviewBeforeSending ? 'pending' : 'sent',
					approvalDeadline:
						reviewBeforeSending && sendDelay
							? new Date(Date.now() + sendDelay * 60 * 1000)
							: null,
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
