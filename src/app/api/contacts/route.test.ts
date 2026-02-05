import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { mockUser } from '@/__tests__/fixtures/users';
import { mockContact, createMockContactList } from '@/__tests__/fixtures/contacts';

// Get mocked modules
const mockAuth0 = vi.mocked(await import('@/lib/auth0'));
const mockPrisma = vi.mocked(await import('@/lib/prisma'));

// Helper to create NextRequest
function createRequest(method: string, body?: object): NextRequest {
	const url = 'http://localhost:3000/api/contacts';
	const init: RequestInit = { method };

	if (body) {
		init.body = JSON.stringify(body);
		init.headers = { 'Content-Type': 'application/json' };
	}

	return new NextRequest(url, init);
}

describe('contacts API route', () => {
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

	describe('GET /api/contacts', () => {
		it('returns contacts for authenticated user', async () => {
			setupAuthenticatedUser();
			const contacts = createMockContactList(3);
			mockPrisma.prisma.contact.findMany.mockResolvedValue(contacts);

			const request = createRequest('GET');
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			// Compare with JSON serialized/parsed version since response goes through JSON
			expect(data.contacts).toEqual(JSON.parse(JSON.stringify(contacts)));
		});

		it('returns empty array when user has no contacts', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findMany.mockResolvedValue([]);

			const request = createRequest('GET');
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.contacts).toEqual([]);
		});

		it('returns 401 when not authenticated', async () => {
			setupUnauthenticated();

			const request = createRequest('GET');
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Unauthorized');
		});

		it('queries contacts with correct ownerId', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findMany.mockResolvedValue([]);

			const request = createRequest('GET');
			await GET(request);

			expect(mockPrisma.prisma.contact.findMany).toHaveBeenCalledWith({
				where: { ownerId: mockUser.id },
			});
		});

		it('returns 500 on database error', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findMany.mockRejectedValue(new Error('Database error'));

			const request = createRequest('GET');
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Database error');
		});
	});

	describe('POST /api/contacts', () => {
		const validContactData = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			company: 'Acme Inc',
			title: 'CEO',
			phone: '+1234567890',
			linkedIn: 'https://linkedin.com/in/johndoe',
			importance: '5',
			reasonForEmail: 'Partnership',
		};

		it('creates contact for authenticated user', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);
			mockPrisma.prisma.contact.create.mockResolvedValue({
				...mockContact,
				...validContactData,
				importance: 5,
			});

			const request = createRequest('POST', validContactData);
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.contact).toBeDefined();
		});

		it('returns 401 when not authenticated', async () => {
			setupUnauthenticated();

			const request = createRequest('POST', validContactData);
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Unauthorized');
		});

		it('returns 400 when firstName is missing', async () => {
			setupAuthenticatedUser();

			const request = createRequest('POST', {
				lastName: 'Doe',
				email: 'john@example.com',
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain('firstName');
		});

		it('returns 400 when lastName is missing', async () => {
			setupAuthenticatedUser();

			const request = createRequest('POST', {
				firstName: 'John',
				email: 'john@example.com',
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain('lastName');
		});

		it('returns 400 when email is missing', async () => {
			setupAuthenticatedUser();

			const request = createRequest('POST', {
				firstName: 'John',
				lastName: 'Doe',
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain('email');
		});

		it('returns duplicate info when contact with email already exists', async () => {
			setupAuthenticatedUser();
			// Existing contact has different data
			mockPrisma.prisma.contact.findFirst.mockResolvedValue({
				...mockContact,
				firstName: 'Jane',
				lastName: 'Smith',
			});

			const request = createRequest('POST', validContactData);
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(false);
			expect(data.duplicate).toBe(true);
			expect(data.existingContact).toBeDefined();
			expect(data.submittedData).toBeDefined();
		});

		it('returns success with existing contact when data is identical', async () => {
			setupAuthenticatedUser();
			const existingContact = {
				...mockContact,
				firstName: validContactData.firstName,
				lastName: validContactData.lastName,
				company: validContactData.company,
				title: validContactData.title,
				email: validContactData.email,
				phone: validContactData.phone,
				linkedIn: validContactData.linkedIn,
				importance: parseInt(validContactData.importance),
				reasonForEmail: validContactData.reasonForEmail,
			};
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(existingContact);

			const request = createRequest('POST', validContactData);
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			// Should not create a new contact
			expect(mockPrisma.prisma.contact.create).not.toHaveBeenCalled();
		});

		it('creates contact with ownerId from authenticated user', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);
			mockPrisma.prisma.contact.create.mockResolvedValue(mockContact);

			const request = createRequest('POST', validContactData);
			await POST(request);

			expect(mockPrisma.prisma.contact.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						ownerId: mockUser.id,
					}),
				})
			);
		});

		it('parses importance as integer', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);
			mockPrisma.prisma.contact.create.mockResolvedValue(mockContact);

			const request = createRequest('POST', validContactData);
			await POST(request);

			expect(mockPrisma.prisma.contact.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						importance: 5, // parsed from '5'
					}),
				})
			);
		});

		it('handles optional fields as null when not provided', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);
			mockPrisma.prisma.contact.create.mockResolvedValue(mockContact);

			const minimalData = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
				importance: '3',
			};

			const request = createRequest('POST', minimalData);
			await POST(request);

			expect(mockPrisma.prisma.contact.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						company: null,
						title: null,
						phone: null,
						linkedIn: null,
						reasonForEmail: null,
					}),
				})
			);
		});

		it('returns 500 on database error during creation', async () => {
			setupAuthenticatedUser();
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);
			mockPrisma.prisma.contact.create.mockRejectedValue(new Error('Database error'));

			const request = createRequest('POST', validContactData);
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Database error');
		});
	});
});
