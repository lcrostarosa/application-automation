import { vi } from 'vitest';

// Mock OpenAI response types
interface MockOpenAIChoice {
	index: number;
	message: {
		role: string;
		content: string;
	};
	finish_reason: string;
}

interface MockOpenAIResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: MockOpenAIChoice[];
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

// Default mock response
export const mockOpenAIResponse: MockOpenAIResponse = {
	id: 'chatcmpl-test123',
	object: 'chat.completion',
	created: Date.now(),
	model: 'gpt-4',
	choices: [
		{
			index: 0,
			message: {
				role: 'assistant',
				content: 'This is a mock AI-generated email follow-up.',
			},
			finish_reason: 'stop',
		},
	],
	usage: {
		prompt_tokens: 100,
		completion_tokens: 50,
		total_tokens: 150,
	},
};

// Mock OpenAI client
export const mockOpenAI = {
	chat: {
		completions: {
			create: vi.fn().mockResolvedValue(mockOpenAIResponse),
		},
	},
};

// Helper to set custom AI response
export function mockOpenAIResponseContent(content: string) {
	mockOpenAI.chat.completions.create.mockResolvedValueOnce({
		...mockOpenAIResponse,
		choices: [
			{
				...mockOpenAIResponse.choices[0],
				message: {
					role: 'assistant',
					content,
				},
			},
		],
	});
}

// Helper to simulate API failure
export function mockOpenAIFailure(error: Error) {
	mockOpenAI.chat.completions.create.mockRejectedValueOnce(error);
}

// Reset OpenAI mocks
export function resetOpenAIMocks() {
	mockOpenAI.chat.completions.create.mockReset();
	mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);
}
