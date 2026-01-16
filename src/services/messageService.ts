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

// Helper for sending a message and updating the corresponding sequence
export async function sendMessage({
	dbContactId,
	dbMessageId,
	dbSequenceId,
	email,
	subject,
	contents,
	inReplyTo,
	threadId,
	endOfSequence,
	nextStepDueDate,
	currentStep,
	alterSubjectLine,
	referencePreviousEmail,
	contact,
	ownerId,
	sequence,
	needsApproval,
	autoSendDelay,
}: {
	dbContactId: number;
	dbMessageId: number;
	dbSequenceId: number;
	email: string;
	subject: string;
	contents: string;
	inReplyTo: string | null;
	threadId: string | null;
	endOfSequence: boolean | null;
	nextStepDueDate: Date | null;
	currentStep: number;
	alterSubjectLine: boolean | null;
	referencePreviousEmail: boolean | null;
	contact: ContactFromDB;
	ownerId: number;
	sequence: SequenceFromDB;
	needsApproval: boolean | null;
	autoSendDelay: number | null;
}) {
	// Send the email
	const result = await sendGmail({
		to: email,
		subject,
		text: endOfSequence ? 'Did I lose you?' : contents,
		inReplyTo: inReplyTo ?? undefined,
		threadId: threadId ?? undefined,
		references: inReplyTo ? [inReplyTo] : [],
	});

	const { messageId } = result;

	if (!messageId) {
		console.error('Failed to send message.');
		return {
			messageId: null,
			updatedMessage: null,
			updatedSequence: null,
			updatedContact: null,
			createdFollowUpMessage: null,
		};
	}

	const [updatedMessage, updatedSequence, updatedContact] =
		await prisma.$transaction([
			// Update the message record in the db
			prisma.message.update({
				where: { id: dbMessageId },
				data: { messageId, status: 'sent', sentAt: new Date() },
			}),

			// Update the sequence in the db
			prisma.sequence.update({
				where: { id: dbSequenceId },
				data: {
					nextStepDue: endOfSequence ? new Date() : nextStepDueDate,
					currentStep: endOfSequence ? currentStep : currentStep + 1,
					updatedAt: new Date(),
					active: endOfSequence ? false : true,
				},
			}),

			// Update the contact in the db
			prisma.contact.update({
				where: { id: dbContactId },
				data: {
					updatedAt: new Date(),
				},
			}),
		]);

	// Create the next message in the sequence (if applicable)
	if (!endOfSequence) {
		// Generate and return the follow-up message
		const { createdFollowUpMessage } = await generateAndCreateNewMessage({
			subject,
			contents,
			alterSubjectLine: alterSubjectLine !== true,
			referencePreviousEmail: referencePreviousEmail !== false,
			contact,
			ownerId,
			sequence,
			messageId,
			threadId,
			needsApproval,
			autoSendDelay,
			nextStepDueDate,
		});

		return {
			messageId,
			updatedMessage,
			updatedSequence,
			updatedContact,
			createdFollowUpMessage,
		};
	}

	return {
		messageId,
		updatedMessage,
		updatedSequence,
		updatedContact,
		createdFollowUpMessage: null,
	};
}

// Helper for generating and creating a message
export async function generateAndCreateNewMessage({
	subject,
	contents,
	alterSubjectLine,
	referencePreviousEmail,
	contact,
	ownerId,
	sequence,
	threadId,
	messageId,
	needsApproval,
	autoSendDelay,
	nextStepDueDate,
}: {
	subject: string;
	contents: string;
	alterSubjectLine: boolean;
	referencePreviousEmail: boolean;
	contact: ContactFromDB;
	ownerId: number;
	sequence: { id: number };
	threadId: string | null;
	messageId: string;
	needsApproval: boolean | null;
	autoSendDelay: number | null;
	nextStepDueDate: Date | null;
}) {
	// Generate and return the follow-up message
	const { subject: newSubject, bodyHtml } = await generateMessage(
		{
			previousSubject: subject,
			previousBody: contents,
		},
		{
			keepSubject: alterSubjectLine !== true,
			preserveThreadContext: referencePreviousEmail !== false,
		}
	);

	const createdFollowUpMessage = await prisma.message.create({
		data: {
			contactId: contact.id,
			ownerId: ownerId,
			sequenceId: sequence.id,
			inReplyTo: messageId,
			subject: newSubject,
			contents: bodyHtml,
			direction: 'outbound',
			threadId,
			createdAt: new Date(),
			needsApproval: needsApproval,
			approved: needsApproval ? false : null,
			status: needsApproval ? 'pending' : 'scheduled',
			approvalDeadline:
				needsApproval && autoSendDelay
					? new Date(Date.now() + autoSendDelay * 60 * 1000)
					: null,
			scheduledAt: nextStepDueDate,
		},
	});

	return { createdFollowUpMessage };
}
