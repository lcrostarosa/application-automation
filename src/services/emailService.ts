import { prisma } from '@/lib/prisma';

// Types imports
import { StoredEmailData } from '@/types/emailTypes';
import { MessageFromDB } from '@/types/messageTypes';
import { SequenceFromDB } from '@/types/sequenceTypes';
import { ContactFromDB } from '@/types/contactTypes';

// Services imports
import { sendMessage } from './messageService';

// Helpers imports
import { parseSequenceData } from '@/lib/helperFunctions';

// Helper function to find or create a contact
export async function findOrCreateContact(email: string, ownerId: number) {
	// Try to find an existing contact with the given email and ownerId
	let contact = await prisma.contact.findFirst({
		where: {
			email: email,
			ownerId: ownerId,
		},
	});

	// If no contact is found, create a new one
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

	// Return the found or newly created contact
	return contact;
}

// Main function to store sent email in the db and handle/update sequences
export async function storeSentEmail({
	email,
	ownerId,
	subject,
	contents,
	cadenceType,
	autoSend,
	autoSendDelay,
	cadenceDuration,
	messageId,
	threadId,
	referencePreviousEmail,
	alterSubjectLine,
}: StoredEmailData) {
	// First find or create the contact that will be associated with the message
	const contact = await findOrCreateContact(email, ownerId);

	// Helpers to map cadenceType and cadenceDuration to their respective values
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

	// Helper to determine sendDelay in days
	const sendDelay =
		autoSendDelay === 'never' || autoSendDelay === '' || !autoSend
			? null
			: autoSendDelay
			? parseInt(autoSendDelay)
			: null;

	// Helper to simplify sequenceDuration calculation
	const sequenceDuration = cadenceDurationMapping[cadenceDuration];

	// Determine endDate for the sequence
	const endDate = sequenceDuration
		? new Date(Date.now() + sequenceDuration * 24 * 60 * 60 * 1000)
		: null;

	// If cadenceType is 'none', there will be no follow-up emails
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
					createdAt: new Date(),
					status: 'sent',
					sentAt: new Date(),
				},
			}),
			prisma.contact.update({
				where: { id: contact.id },
				data: { lastActivity: new Date() },
			}),
		]);
		return { createdMessage, updatedContact };
	}

	// Because cadenceType is not 'none', we need to create a new sequence
	// Steps to follow:
	// 1. Create the new sequence
	// 2. Save the message to the db associated with the new sequence
	// 3. Update the contact to reflect last activity and change their active status to true
	// 4. Create the next message in the sequence (if applicable)

	// Helper function to determine the next step due date for new sequence-to-be
	const nextStepDueDate =
		cadenceType === '31day'
			? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
			: new Date(
					Date.now() + cadenceTypeMapping[cadenceType] * 24 * 60 * 60 * 1000
			  );

	// Create the new sequence
	const sequence = await prisma.sequence.create({
		data: {
			title: subject,
			contactId: contact.id,
			ownerId,
			sequenceType: cadenceType,
			autoSend: autoSend ? false : true,
			autoSendDelay: sendDelay,
			sequenceDuration: cadenceDurationMapping[cadenceDuration],
			nextStepDue: nextStepDueDate,
			endDate,
			referencePreviousEmail: referencePreviousEmail || null,
			alterSubjectLine: alterSubjectLine || null,
		},
	});

	// Transaction safety: create message and update contact in transaction
	const [storedMessage, updatedContact] = await prisma.$transaction([
		// Create the message associated with the new sequence (this is technically the first message in the sequence)
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
				createdAt: new Date(),
				needsApproval: autoSend,
				status: 'sent',
				approvalDeadline:
					autoSend && sendDelay
						? new Date(Date.now() + sendDelay * 60 * 1000)
						: null,
				sentAt: new Date(),
				needsFollowUp: true,
			},
		}),

		// Update the contact's last activity and active status
		prisma.contact.update({
			where: { id: contact.id },
			data: { lastActivity: new Date(), active: true },
		}),
	]);

	console.log(storedMessage);

	return { storedMessage, updatedContact };
}

export async function updateExistingSequenceMessage(message: MessageFromDB) {
	// Take the existing message, determine its status. If it is ready to be sent, send it, update its status to sent, update the sequence next steps, and create the next message in the sequence, otherwise if it's pending approval but the deadline for approval has passed, update its status to scheduled with the deadline being the approvalDeadline
	// 1. Parse all message data, sequence data, and contact data and create associated vars
	// 2. Check if message needs approval
	// 3. If the message doesn't need approval and it's passed it's scheduledAt date, send the message, update the db. If it needs approval, set scheduledAt to the approvalDeadline, otherwise if the message is approved, set scheduledAt to createdAt + sequence.nextStepDue
	// 4. Send the email
	// 5. Update the message status
	// 6. Update the sequence nextStepDue date
	// 7. Create the next message in the sequence (if applicable)

	const {
		inReplyTo,
		threadId,
		scheduledAt,
		needsApproval,
		approvalDeadline,
		approved,
		subject,
		contents,
		sequenceId,
		ownerId,
	} = message;

	if (!inReplyTo || !threadId) {
		return console.error('Message is missing inReplyTo or threadId');
	}

	const sequence = (await prisma.sequence.findUnique({
		where: { id: sequenceId!, ownerId: message.ownerId },
		include: { messages: true, emailReplies: true },
	})) as SequenceFromDB;
	const {
		currentStep,
		autoSendDelay,
		endDate,
		referencePreviousEmail,
		alterSubjectLine,
	} = sequence;
	const contact = (await prisma.contact.findUnique({
		where: { id: message.contactId },
	})) as ContactFromDB;
	const { email } = contact;
	const { nextStepDueDate } = parseSequenceData(
		sequence.sequenceType,
		sequence.currentStep,
		sequence.endDate
	);
	const endOfSequence = endDate && nextStepDueDate && nextStepDueDate > endDate;
	const passedScheduledAt = new Date() > scheduledAt!;
	const passedApprovalDeadline =
		approvalDeadline && new Date() > approvalDeadline;

	// If the message does not need approval and the scheduledAt date has passed, send the message
	if (!needsApproval && passedScheduledAt) {
		const {
			messageId,
			updatedMessage,
			updatedSequence,
			updatedContact,
			createdFollowUpMessage,
		} = await sendMessage({
			dbContactId: contact.id,
			dbMessageId: message.id,
			dbSequenceId: sequence.id,
			email,
			subject,
			contents,
			inReplyTo,
			threadId,
			endOfSequence,
			nextStepDueDate,
			currentStep,
			alterSubjectLine: alterSubjectLine !== true,
			referencePreviousEmail: referencePreviousEmail !== false,
			contact,
			ownerId,
			sequence,
			needsApproval,
			autoSendDelay,
		});

		return {
			messageId,
			updatedMessage,
			updatedSequence,
			updatedContact,
			createdFollowUpMessage,
		};
	}

	if (approved) {
		// If the message is approved but the scheduledAt date has not passed, update its status to 'scheduled'
		if (!passedScheduledAt) {
			const updatedMessage = await prisma.message.update({
				where: { id: message.id },
				data: { status: 'scheduled' },
			});

			return {
				messageId: null,
				updatedMessage,
				updatedSequence: null,
				updatedContact: null,
				createdFollowUpMessage: null,
			};
		}

		// If the scheduledAt date has passed, send the message, update its status to 'sent', and update the sequence next steps
		// Send the email
		const {
			messageId,
			updatedMessage,
			updatedSequence,
			updatedContact,
			createdFollowUpMessage,
		} = await sendMessage({
			dbContactId: contact.id,
			dbMessageId: message.id,
			dbSequenceId: sequence.id,
			email,
			subject,
			contents,
			inReplyTo,
			threadId,
			endOfSequence,
			nextStepDueDate,
			currentStep,
			alterSubjectLine: alterSubjectLine !== true,
			referencePreviousEmail: referencePreviousEmail !== false,
			contact,
			ownerId,
			sequence,
			needsApproval,
			autoSendDelay,
		});

		return {
			messageId,
			updatedMessage,
			updatedSequence,
			updatedContact,
			createdFollowUpMessage,
		};
	}

	// If there's no approval deadline (meaning can be pending forever) and the scheduledAt date has passed, notify the user
	// if (!approvalDeadline && passedScheduledAt) {
	// 	// NOTIFY THE USER THAT THE MESSAGE IS PAST ITS SCHEDULE DATE AND NEEDS APPROVAL
	// 	// IF NOTIFICATION NOT CLEARED, DON'T NOTIFY, OTHERWISE NOTIFY EVERY 48 HOURS AFTER CLEAR
	// }

	// If the message has not been approved and it's passed the scheduledAt date
	if (passedScheduledAt && !passedApprovalDeadline) {
		// If there is an approval deadline
		const updatedMessage = await prisma.message.update({
			where: { id: message.id },
			data: { status: 'scheduled' },
		});

		// NOTIFY THE USER THAT THE MESSAGE IS STILL NOT APPROVED AND HAS BEEN SCHEDULED FOR AUTO SENDING IN X AMOUNT OF TIME

		return { updatedMessage };
	}

	if (passedApprovalDeadline) {
		const {
			messageId,
			updatedMessage,
			updatedSequence,
			updatedContact,
			createdFollowUpMessage,
		} = await sendMessage({
			dbContactId: contact.id,
			dbMessageId: message.id,
			dbSequenceId: sequence.id,
			email,
			subject,
			contents,
			inReplyTo,
			threadId,
			endOfSequence,
			nextStepDueDate,
			currentStep,
			alterSubjectLine: alterSubjectLine !== true,
			referencePreviousEmail: referencePreviousEmail !== false,
			contact,
			ownerId,
			sequence,
			needsApproval,
			autoSendDelay,
		});

		return {
			messageId,
			updatedMessage,
			updatedSequence,
			updatedContact,
			createdFollowUpMessage,
		};
	}

	return undefined;
}
