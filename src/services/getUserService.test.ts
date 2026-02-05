import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiUser } from './getUserService';
import { mockUser } from '@/__tests__/fixtures/users';

// Get mocked modules
const mockAuth0 = vi.mocked(await import('@/lib/auth0'));
const mockPrisma = vi.mocked(await import('@/lib/prisma'));

describe('getUserService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getApiUser', () => {
		it('returns user when authenticated and found in database', async () => {
			// Setup: authenticated session
			mockAuth0.auth0.getSession.mockResolvedValue({
				user: { sub: mockUser.auth0Id, email: mockUser.email, name: mockUser.name },
			});

			// Setup: user exists in database
			mockPrisma.prisma.user.findUnique.mockResolvedValue(mockUser);

			const result = await getApiUser();

			expect(result.user).toEqual(mockUser);
			expect(result.error).toBeNull();
			expect(mockPrisma.prisma.user.findUnique).toHaveBeenCalledWith({
				where: { auth0Id: mockUser.auth0Id },
			});
		});

		it('returns 401 error when no session exists', async () => {
			// Setup: no session
			mockAuth0.auth0.getSession.mockResolvedValue(null);

			const result = await getApiUser();

			expect(result.user).toBeNull();
			expect(result.error).toEqual({ error: 'Unauthorized', status: 401 });
			expect(mockPrisma.prisma.user.findUnique).not.toHaveBeenCalled();
		});

		it('returns 401 error when session has no user', async () => {
			// Setup: session without user
			mockAuth0.auth0.getSession.mockResolvedValue({ user: null } as never);

			const result = await getApiUser();

			expect(result.user).toBeNull();
			expect(result.error).toEqual({ error: 'Unauthorized', status: 401 });
		});

		it('returns 404 error when user not found in database', async () => {
			// Setup: authenticated session
			mockAuth0.auth0.getSession.mockResolvedValue({
				user: { sub: 'auth0|unknown', email: 'unknown@test.com', name: 'Unknown' },
			});

			// Setup: user not found
			mockPrisma.prisma.user.findUnique.mockResolvedValue(null);

			const result = await getApiUser();

			expect(result.user).toBeNull();
			expect(result.error).toEqual({ error: 'Unauthorized', status: 404 });
		});

		it('uses auth0Id from session.user.sub to find user', async () => {
			const testAuth0Id = 'auth0|specific-test-id';

			mockAuth0.auth0.getSession.mockResolvedValue({
				user: { sub: testAuth0Id, email: 'test@test.com', name: 'Test' },
			});
			mockPrisma.prisma.user.findUnique.mockResolvedValue(mockUser);

			await getApiUser();

			expect(mockPrisma.prisma.user.findUnique).toHaveBeenCalledWith({
				where: { auth0Id: testAuth0Id },
			});
		});
	});
});
