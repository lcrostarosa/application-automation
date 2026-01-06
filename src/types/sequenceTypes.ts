export interface SequenceFromDB {
	id: number;
	contactId: number;
	ownerId: number;
	sequenceType: string;
	autoSend: boolean;
	autoSendDelay: number | null;
	sequenceDuration: number | null;
	currentStep: number;
	nextStepDue: Date | null;
	endDate: Date | null;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface SequencesResponse {
	sequences: SequenceFromDB[];
}
