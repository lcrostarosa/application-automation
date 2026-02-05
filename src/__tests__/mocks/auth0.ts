import { vi } from 'vitest';

// Types for Auth0 session
interface Auth0User {
	sub: string;
	email: string;
	name: string;
	picture?: string;
	email_verified?: boolean;
}

interface Auth0Session {
	user: Auth0User;
	accessToken?: string;
	idToken?: string;
	refreshToken?: string;
}

// Default mock user data
export const mockAuth0User: Auth0User = {
	sub: 'auth0|test-user-123',
	email: 'test@example.com',
	name: 'Test User',
	picture: 'https://example.com/avatar.png',
	email_verified: true,
};

// Mock authenticated session
export const mockAuthenticatedSession: Auth0Session = {
	user: mockAuth0User,
	accessToken: 'test-access-token',
	idToken: 'test-id-token',
};

// Helper to set up authenticated state
export async function mockAuthenticated(customUser?: Partial<Auth0User>) {
	const { auth0 } = await import('@/lib/auth0');
	vi.mocked(auth0.getSession).mockResolvedValue({
		user: { ...mockAuth0User, ...customUser },
		accessToken: 'test-access-token',
		idToken: 'test-id-token',
	});
}

// Helper to set up unauthenticated state
export async function mockUnauthenticated() {
	const { auth0 } = await import('@/lib/auth0');
	vi.mocked(auth0.getSession).mockResolvedValue(null);
}

// Helper to create custom session
export function createMockSession(
	user: Partial<Auth0User> = {}
): Auth0Session {
	return {
		user: { ...mockAuth0User, ...user },
		accessToken: 'test-access-token',
		idToken: 'test-id-token',
	};
}
