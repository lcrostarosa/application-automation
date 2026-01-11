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
	needsApproval: boolean;
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
}

export interface MessagesResponse {
	messages: MessageFromDB[] | [];
}

export interface MessagesWithActiveSequence extends MessageFromDB {
	activeSequence: boolean;
}
