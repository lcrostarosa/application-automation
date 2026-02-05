import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllContacts, getContactById } from './contactsService';
import { mockUser } from '@/__tests__/fixtures/users';
import { mockContact, createMockContactList } from '@/__tests__/fixtures/contacts';

// Get mocked modules
const mockAuth0 = vi.mocked(await import('@/lib/auth0'));
const mockPrisma = vi.mocked(await import('@/lib/prisma'));
const mockNavigation = vi.mocked(await import('next/navigation'));

describe('contactsService', () => {
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

	describe('getAllContacts', () => {
		it('returns all contacts for authenticated user', async () => {
			setupAuthenticatedUser();
			const contacts = createMockContactList(3);
			mockPrisma.prisma.contact.findMany.mockResolvedValue(contacts);

			const result = await getAllContacts();

			expect(result).toEqual(contacts);
			expect(mockPrisma.prisma.contact.findMany).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id },
			});
		});

		it('returns empty array when user has no contacts', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findMany.mockResolvedValue([]);

			const result = await getAllContacts();

			expect(result).toEqual([]);
		});

		it('redirects to home when not authenticated', async () => {
			setupUnauthenticated();

			await getAllContacts();

			expect(mockNavigation.redirect).toHaveBeenCalledWith('/');
			expect(mockPrisma.prisma.contact.findMany).not.toHaveBeenCalled();
		});

		it('redirects to home when user not found in database', async () => {
			mockAuth0.auth0.getSession.mockResolvedValue({
				user: { sub: 'auth0|unknown', email: 'unknown@test.com', name: 'Unknown' },
			});
			mockPrisma.prisma.user.findUnique.mockResolvedValue(null);

			await getAllContacts();

			expect(mockNavigation.redirect).toHaveBeenCalledWith('/');
		});

		it('queries contacts with correct ownerId', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findMany.mockResolvedValue([]);

			await getAllContacts();

			expect(mockPrisma.prisma.contact.findMany).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id },
			});
		});
	});

	describe('getContactById', () => {
		it('returns contact when found for authenticated user', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(mockContact);

			const result = await getContactById(mockContact.id);

			expect(result).toEqual(mockContact);
			expect(mockPrisma.prisma.contact.findFirst).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id, id: mockContact.id },
			});
		});

		it('returns null when contact not found', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);

			const result = await getContactById(999);

			expect(result).toBeNull();
		});

		it('redirects to home when not authenticated', async () => {
			setupUnauthenticated();

			await getContactById(1);

			expect(mockNavigation.redirect).toHaveBeenCalledWith('/');
			expect(mockPrisma.prisma.contact.findFirst).not.toHaveBeenCalled();
		});

		it('only returns contact owned by authenticated user', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(mockContact);

			await getContactById(mockContact.id);

			// Verify ownerId filter is applied
			expect(mockPrisma.prisma.contact.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						ownerId: mockUser.id,
					}),
				})
			);
		});

		it('handles different contact IDs correctly', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);

			await getContactById(42);

			expect(mockPrisma.prisma.contact.findFirst).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id, id: 42 },
			});
		});
	});
});
