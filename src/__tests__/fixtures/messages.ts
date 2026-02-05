// Message fixtures for testing
import { MessageFromDB, MessageWithContact } from '@/types/messageTypes';
import { mockContact } from './contacts';

// Standard sent message
export const mockMessage: MessageFromDB = {
	id: 1,
	contactId: 1,
	ownerId: 1,
	sequenceId: null,
	subject: 'Test Subject',
	contents: '<p>Hello, this is a test message.</p>',
	direction: 'outbound',
	messageId: 'msg-123@gmail.com',
	threadId: 'thread-456',
	inReplyTo: null,
	status: 'sent',
	sentAt: new Date('2024-01-15T10:00:00Z'),
	createdAt: new Date('2024-01-15T09:00:00Z'),
	scheduledAt: null,
	hasReply: false,
	replyDate: null,
	needsApproval: false,
	approved: true,
	approvalDeadline: null,
	lastError: null,
	sendAttempts: 1,
	templateId: null,
	needsFollowUp: false,
	nextMessageGenerated: false,
};

// Pending message awaiting approval
export const mockPendingMessage: MessageFromDB = {
	...mockMessage,
	id: 2,
	status: 'pending',
	sentAt: null,
	needsApproval: true,
	approved: false,
	approvalDeadline: new Date('2024-01-20T10:00:00Z'),
};

// Scheduled message
export const mockScheduledMessage: MessageFromDB = {
	...mockMessage,
	id: 3,
	status: 'scheduled',
	sentAt: null,
	scheduledAt: new Date('2024-01-25T10:00:00Z'),
	needsApproval: false,
	approved: true,
};

// Message that is part of a sequence
export const mockSequenceMessage: MessageFromDB = {
	...mockMessage,
	id: 4,
	sequenceId: 1,
	needsFollowUp: true,
	nextMessageGenerated: false,
};

// Message with reply
export const mockMessageWithReply: MessageFromDB = {
	...mockMessage,
	id: 5,
	hasReply: true,
	replyDate: new Date('2024-01-16T14:00:00Z'),
};

// Failed message
export const mockFailedMessage: MessageFromDB = {
	...mockMessage,
	id: 6,
	status: 'failed',
	sentAt: null,
	lastError: 'SMTP connection timeout',
	sendAttempts: 3,
};

// Message with contact included
export const mockMessageWithContact: MessageWithContact = {
	...mockPendingMessage,
	contact: mockContact,
};

// Factory function for creating custom messages
export function createMockMessage(
	overrides: Partial<MessageFromDB> = {}
): MessageFromDB {
	return {
		...mockMessage,
		id: Math.floor(Math.random() * 10000),
		messageId: `msg-${Date.now()}@gmail.com`,
		...overrides,
	};
}

// Create a list of messages
export function createMockMessageList(count: number): MessageFromDB[] {
	return Array.from({ length: count }, (_, i) =>
		createMockMessage({
			id: i + 1,
			subject: `Test Subject ${i + 1}`,
		})
	);
}
