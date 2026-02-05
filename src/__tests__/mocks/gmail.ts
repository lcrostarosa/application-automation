import { vi } from 'vitest';

// Mock response for sent email
export interface MockSentEmailResponse {
	id: string;
	threadId: string;
	labelIds: string[];
}

// Default mock response
export const mockSentEmailResponse: MockSentEmailResponse = {
	id: 'mock-message-id-123',
	threadId: 'mock-thread-id-456',
	labelIds: ['SENT'],
};

// Mock Gmail send function
export const mockSendGmail = vi.fn().mockResolvedValue(mockSentEmailResponse);

// Helper to simulate send failure
export function mockGmailSendFailure(error: Error) {
	mockSendGmail.mockRejectedValueOnce(error);
}

// Helper to simulate successful send with custom response
export function mockGmailSendSuccess(response: Partial<MockSentEmailResponse>) {
	mockSendGmail.mockResolvedValueOnce({
		...mockSentEmailResponse,
		...response,
	});
}

// Reset Gmail mocks
export function resetGmailMocks() {
	mockSendGmail.mockReset();
	mockSendGmail.mockResolvedValue(mockSentEmailResponse);
}
