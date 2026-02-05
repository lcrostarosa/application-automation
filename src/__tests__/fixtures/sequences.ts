// Sequence fixtures for testing
import { mockContact } from './contacts';
import { mockSequenceMessage } from './messages';

// Basic sequence type without Prisma dependencies
export interface MockSequence {
	id: number;
	title: string;
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
	referencePreviousEmail: boolean | null;
	alterSubjectLine: boolean | null;
	createdAt: Date;
	updatedAt: Date;
}

// Basic sequence
export const mockSequence: MockSequence = {
	id: 1,
	title: 'Test Follow-up Sequence',
	contactId: 1,
	ownerId: 1,
	sequenceType: '3day',
	autoSend: false,
	autoSendDelay: null,
	sequenceDuration: 30,
	currentStep: 1,
	nextStepDue: new Date('2024-01-18T10:00:00Z'),
	endDate: new Date('2024-02-15T10:00:00Z'),
	active: true,
	referencePreviousEmail: true,
	alterSubjectLine: false,
	createdAt: new Date('2024-01-15T10:00:00Z'),
	updatedAt: new Date('2024-01-15T10:00:00Z'),
};

// Weekly sequence
export const mockWeeklySequence: MockSequence = {
	...mockSequence,
	id: 2,
	title: 'Weekly Check-in',
	sequenceType: 'weekly',
	nextStepDue: new Date('2024-01-22T10:00:00Z'),
};

// Biweekly sequence
export const mockBiweeklySequence: MockSequence = {
	...mockSequence,
	id: 3,
	title: 'Bi-weekly Outreach',
	sequenceType: 'biweekly',
	nextStepDue: new Date('2024-01-29T10:00:00Z'),
};

// Monthly sequence
export const mockMonthlySequence: MockSequence = {
	...mockSequence,
	id: 4,
	title: 'Monthly Newsletter',
	sequenceType: 'monthly',
	sequenceDuration: null, // indefinite
	endDate: null,
};

// Inactive sequence
export const mockInactiveSequence: MockSequence = {
	...mockSequence,
	id: 5,
	title: 'Completed Sequence',
	active: false,
	nextStepDue: null,
};

// Auto-send enabled sequence
export const mockAutoSendSequence: MockSequence = {
	...mockSequence,
	id: 6,
	title: 'Auto-send Sequence',
	autoSend: true,
	autoSendDelay: 24, // 24 hours
};

// Sequence with relations (contact and messages)
export const mockSequenceWithRelations = {
	...mockSequence,
	contact: mockContact,
	messages: [mockSequenceMessage],
	emailReplies: [],
};

// Factory function for creating custom sequences
export function createMockSequence(
	overrides: Partial<MockSequence> = {}
): MockSequence {
	return {
		...mockSequence,
		id: Math.floor(Math.random() * 10000),
		title: `Sequence ${Date.now()}`,
		...overrides,
	};
}

// Create a list of sequences
export function createMockSequenceList(count: number): MockSequence[] {
	return Array.from({ length: count }, (_, i) =>
		createMockSequence({
			id: i + 1,
			title: `Test Sequence ${i + 1}`,
		})
	);
}
