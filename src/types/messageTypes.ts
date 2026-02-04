import { ContactFromDB } from './contactTypes';

export interface MessageFromDB {
	contactId: number;
	contents: string;
	createdAt: Date;
	direction: string;
	hasReply: boolean;
	id: number;
	inReplyTo: string | null;
	lastError: string | null;
	messageId: string | null;
	needsApproval: boolean | null;
	approved: boolean | null;
	approvalDeadline: Date | null;
	ownerId: number;
	replyDate: Date | null;
	scheduledAt: Date | null;
	sendAttempts: number;
	sentAt: Date | null;
	sequenceId: number | null;
	status: string;
	subject: string;
	templateId: number | null;
	threadId: string | null;
	needsFollowUp: boolean;
	nextMessageGenerated: boolean;
}

export interface MessageWithContact extends MessageFromDB {
	contact: ContactFromDB;
}

export interface MessagesResponse {
	messages: MessageFromDB[] | [];
}

export interface MessagesWithActiveSequence extends MessageFromDB {
	activeSequence: boolean;
}

export interface MessageCreationData {
	contactId: number;
	ownerId: number;
	sequenceId?: number | null;
	subject: string;
	contents: string;
	messageId: string | null;
	threadId: string | null;
	inReplyTo?: string | null;
	autoSend: boolean;
	scheduledAt?: Date | null;
	sendDelay?: number | null;
	referencePreviousEmail?: boolean | null;
	alterSubjectLine?: boolean | null;
}
