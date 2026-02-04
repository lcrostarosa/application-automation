import { Prisma } from '../../generated/prisma';

export type SequenceFromDB = Prisma.SequenceGetPayload<{
	include: {
		contact: true;
		messages: true;
		emailReplies: true;
	};
}>;

export interface SequencesResponse {
	sequences: SequenceFromDB[];
}
