export interface StoredEmailData {
	email: string;
	ownerId: number;
	subject: string;
	contents: string;
	cadenceType: string;
	autoSend: boolean;
	autoSendDelay?: string;
	cadenceDuration: string;
	messageId: string;
	threadId: string;
	inReplyTo?: string;
	sequenceId?: number;
	referencePreviousEmail?: boolean | null;
	alterSubjectLine?: boolean | null;
}

export interface SentEmailData {
	to: string;
	subject: string;
	autoSend: boolean;
	cadenceType: string;
	autoSendDelay?: string;
	cadenceDuration: string;
	body: string;
	override?: boolean;
	sequenceId?: number;
	activeSequenceId?: number;
}

export interface PendingEmailData {
	to: string;
	subject: string;
	cadenceType: string;
	autoSend: boolean;
	autoSendDelay?: string;
	cadenceDuration: string;
	body: string;
	override?: boolean;
	referencePreviousEmail?: boolean | null;
	alterSubjectLine?: boolean | null;
	activeSequenceId: number;
}
