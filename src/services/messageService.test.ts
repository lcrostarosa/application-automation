import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getAllMessagesByUserId,
	getAllPendingMessages,
	getAllMessagesByContactId,
	getStandaloneMessagesByContactId,
} from './messageService';
import { mockUser } from '@/__tests__/fixtures/users';
import { mockContact } from '@/__tests__/fixtures/contacts';
import {
	mockMessage,
	mockSequenceMessage,
	mockMessageWithContact,
	createMockMessageList,
} from '@/__tests__/fixtures/messages';

// Get mocked modules
const mockAuth0 = vi.mocked(await import('@/lib/auth0'));
const mockPrisma = vi.mocked(await import('@/lib/prisma'));

describe('messageService', () => {
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

	describe('getAllMessagesByUserId', () => {
		it('returns all messages for authenticated user', async () => {
			setupAuthenticatedUser();
			const messages = createMockMessageList(5);
			mockPrisma.prisma.message.findMany.mockResolvedValue(messages);

			const result = await getAllMessagesByUserId();

			expect(result.messages).toEqual(messages);
			expect(mockPrisma.prisma.message.findMany).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id },
				orderBy: { createdAt: 'desc' },
			});
		});

		it('returns empty array when user has no messages', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.findMany.mockResolvedValue([]);

			const result = await getAllMessagesByUserId();

			expect(result.messages).toEqual([]);
		});

		it('returns empty array when not authenticated', async () => {
			setupUnauthenticated();

			const result = await getAllMessagesByUserId();

			expect(result.messages).toEqual([]);
			expect(mockPrisma.prisma.message.findMany).not.toHaveBeenCalled();
		});

		it('orders messages by createdAt descending', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.findMany.mockResolvedValue([mockMessage]);

			await getAllMessagesByUserId();

			expect(mockPrisma.prisma.message.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					orderBy: { createdAt: 'desc' },
				})
			);
		});
	});

	describe('getAllPendingMessages', () => {
		it('returns pending and scheduled messages with contacts', async () => {
			setupAuthenticatedUser();
			const pendingMessages = [mockMessageWithContact];
			mockPrisma.prisma.message.findMany.mockResolvedValue(pendingMessages);

			const result = await getAllPendingMessages();

			expect(result.messages).toEqual(pendingMessages);
			expect(mockPrisma.prisma.message.findMany).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id, status: { in: ['pending', 'scheduled'] } },
				include: { contact: true },
				orderBy: { createdAt: 'desc' },
			});
		});

		it('filters for pending and scheduled status', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.findMany.mockResolvedValue([]);

			await getAllPendingMessages();

			expect(mockPrisma.prisma.message.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						status: { in: ['pending', 'scheduled'] },
					}),
				})
			);
		});

		it('includes contact relation', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.findMany.mockResolvedValue([]);

			await getAllPendingMessages();

			expect(mockPrisma.prisma.message.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					include: { contact: true },
				})
			);
		});

		it('returns empty array when not authenticated', async () => {
			setupUnauthenticated();

			const result = await getAllPendingMessages();

			expect(result.messages).toEqual([]);
		});
	});

	describe('getAllMessagesByContactId', () => {
		it('returns all messages for a specific contact', async () => {
			setupAuthenticatedUser();
			const messages = [mockMessage, mockSequenceMessage];
			mockPrisma.prisma.message.findMany.mockResolvedValue(messages);

			const result = await getAllMessagesByContactId(mockContact.id);

			expect(result.messages).toEqual(messages);
			expect(mockPrisma.prisma.message.findMany).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id, contactId: mockContact.id },
				orderBy: { createdAt: 'desc' },
			});
		});

		it('filters by both ownerId and contactId', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.findMany.mockResolvedValue([]);

			await getAllMessagesByContactId(42);

			expect(mockPrisma.prisma.message.findMany).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id, contactId: 42 },
				orderBy: { createdAt: 'desc' },
			});
		});

		it('returns empty array when not authenticated', async () => {
			setupUnauthenticated();

			const result = await getAllMessagesByContactId(1);

			expect(result.messages).toEqual([]);
		});

		it('returns empty array when no messages for contact', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.findMany.mockResolvedValue([]);

			const result = await getAllMessagesByContactId(999);

			expect(result.messages).toEqual([]);
		});
	});

	describe('getStandaloneMessagesByContactId', () => {
		it('returns messages without sequence for a contact', async () => {
			setupAuthenticatedUser();
			// Standalone message has sequenceId: null
			mockPrisma.prisma.message.findMany.mockResolvedValue([mockMessage]);

			const result = await getStandaloneMessagesByContactId(mockContact.id);

			expect(result.messages).toEqual([mockMessage]);
			expect(mockPrisma.prisma.message.findMany).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id, contactId: mockContact.id, sequenceId: null },
				orderBy: { createdAt: 'desc' },
			});
		});

		it('filters for sequenceId: null (standalone)', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.message.findMany.mockResolvedValue([]);

			await getStandaloneMessagesByContactId(1);

			expect(mockPrisma.prisma.message.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						sequenceId: null,
					}),
				})
			);
		});

		it('excludes messages that are part of sequences', async () => {
			setupAuthenticatedUser();
			// Only standalone messages (sequenceId: null) should be returned
			mockPrisma.prisma.message.findMany.mockResolvedValue([mockMessage]);

			const result = await getStandaloneMessagesByContactId(mockContact.id);

			// mockMessage has sequenceId: null, mockSequenceMessage has sequenceId: 1
			expect(result.messages).toHaveLength(1);
			expect(result.messages[0].sequenceId).toBeNull();
		});

		it('returns empty array when not authenticated', async () => {
			setupUnauthenticated();

			const result = await getStandaloneMessagesByContactId(1);

			expect(result.messages).toEqual([]);
		});
	});
});
