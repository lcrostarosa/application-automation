import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from './route';
import { NextRequest } from 'next/server';
import { mockUser } from '@/__tests__/fixtures/users';
import { mockPendingMessage, mockMessage } from '@/__tests__/fixtures/messages';

// Get mocked modules
const mockAuth0 = vi.mocked(await import('@/lib/auth0'));
const mockPrisma = vi.mocked(await import('@/lib/prisma'));

// Helper to create NextRequest with params
function createRequest(id: string): NextRequest {
	const url = `http://localhost:3000/api/messages/${id}/approve`;
	return new NextRequest(url, { method: 'PUT' });
}

describe('messages/[id]/approve API route', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// Helper to setup authenticated user
	const setupAuthenticatedUser = () => {
		mockAuth0.auth0.getSession.mockResolvedValue({
			user: { sub: mockUser.auth0Id, email: mockUser.email, name: mockUser.name },
		});
		mockPrisma.prisma.user.findUnique.mockResolvedValue(mockUser);
	};

	// Helper to setup unauthenticated state
	const setupUnauthenticated = () => {
		mockAuth0.auth0.getSession.mockResolvedValue(null);
	};

	describe('PUT /api/messages/[id]/approve', () => {
		it('approves message for authenticated user', async () => {
			setupAuthenticatedUser();
			const approvedMessage = {
				...mockPendingMessage,
				needsApproval: false,
				approved: true,
				status: 'scheduled',
			};
			mockPrisma.prisma.message.update.mockResolvedValue(approvedMessage);

			const request = createRequest('1');
			const params = Promise.resolve({ id: '1' });
			const response = await PUT(request, { params });
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.message).toEqual(approvedMessage);
		});

		it('updates message with correct approval fields', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.update.mockResolvedValue(mockMessage);

			const request = createRequest('1');
			const params = Promise.resolve({ id: '1' });
			await PUT(request, { params });

			expect(mockPrisma.prisma.message.update).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id, id: 1 },
				data: { needsApproval: false, approved: true, status: 'scheduled' },
			});
		});

		it('returns 401 when not authenticated', async () => {
			setupUnauthenticated();

			const request = createRequest('1');
			const params = Promise.resolve({ id: '1' });
			const response = await PUT(request, { params });
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Unauthorized');
		});

		it('parses message ID from params', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.update.mockResolvedValue(mockMessage);

			const request = createRequest('42');
			const params = Promise.resolve({ id: '42' });
			await PUT(request, { params });

			expect(mockPrisma.prisma.message.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						id: 42,
					}),
				})
			);
		});

		it('filters by ownerId to prevent unauthorized access', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.update.mockResolvedValue(mockMessage);

			const request = createRequest('1');
			const params = Promise.resolve({ id: '1' });
			await PUT(request, { params });

			expect(mockPrisma.prisma.message.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						ownerId: mockUser.id,
					}),
				})
			);
		});

		it('sets status to "scheduled" after approval', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.update.mockResolvedValue(mockMessage);

			const request = createRequest('1');
			const params = Promise.resolve({ id: '1' });
			await PUT(request, { params });

			expect(mockPrisma.prisma.message.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						status: 'scheduled',
					}),
				})
			);
		});

		it('returns 500 on database error', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.update.mockRejectedValue(new Error('Database error'));

			const request = createRequest('1');
			const params = Promise.resolve({ id: '1' });
			const response = await PUT(request, { params });
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Database error');
		});

		it('returns 500 when message not found', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.update.mockRejectedValue(
				new Error('Record to update not found')
			);

			const request = createRequest('999');
			const params = Promise.resolve({ id: '999' });
			const response = await PUT(request, { params });
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Record to update not found');
		});

		it('handles different message IDs', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.update.mockResolvedValue(mockMessage);

			for (const id of ['1', '100', '999']) {
				const request = createRequest(id);
				const params = Promise.resolve({ id });
				await PUT(request, { params });

				expect(mockPrisma.prisma.message.update).toHaveBeenLastCalledWith(
					expect.objectContaining({
						where: expect.objectContaining({
							id: parseInt(id),
						}),
					})
				);
			}
		});
	});
});
