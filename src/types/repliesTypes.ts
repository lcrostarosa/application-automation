import { ContactFromDB } from './contactTypes';

export interface RepliesFromDB {
	id: number;
	ownerId: number;
	originalMessageId: string;
	replyMessageId: string;
	threadId: string;
	contactId: number;
	sequenceId: number | null;
	replySubject: string;
	replyContent: string;
	replyHistory?: string | null;
	replyDate: Date;
	isAutomated: boolean;
	processed: boolean;
	createdAt: Date;
	contact?: ContactFromDB;
}

export interface RepliesResponse {
	replies: RepliesFromDB[] | [];
}
