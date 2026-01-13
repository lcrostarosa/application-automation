export interface StoredEmailData {
	email: string;
	ownerId: number;
	subject: string;
	contents: string;
	cadenceType: string;
	reviewBeforeSending: boolean;
	sendWithoutReviewAfter?: string;
	cadenceDuration: string;
	messageId: string;
	threadId: string;
	inReplyTo?: string;
	sequenceId?: number;
}

export interface SentEmailData {
	to: string;
	subject: string;
	reviewBeforeSending: boolean;
	cadenceType: string;
	sendWithoutReviewAfter?: string;
	cadenceDuration: string;
	body: string;
	override?: boolean;
	sequenceId?: number;
}

export interface PendingEmailData {
	to: string;
	subject: string;
	cadenceType: string;
	reviewBeforeSending: boolean;
	sendWithoutReviewAfter?: string;
	cadenceDuration: string;
	body: string;
	override?: boolean;
}
