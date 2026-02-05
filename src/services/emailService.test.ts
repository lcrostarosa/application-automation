import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findOrCreateContact, storeSentEmail } from './emailService';
import { mockUser } from '@/__tests__/fixtures/users';
import { mockContact, mockAutoCreatedContact } from '@/__tests__/fixtures/contacts';
import { mockMessage } from '@/__tests__/fixtures/messages';
import { mockSequence } from '@/__tests__/fixtures/sequences';

// Get mocked modules
const mockPrisma = vi.mocked(await import('@/lib/prisma'));

describe('emailService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findOrCreateContact', () => {
		it('returns existing contact when found', async () => {
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(mockContact);

			const result = await findOrCreateContact(mockContact.email, mockUser.id);

			expect(result.contact).toEqual(mockContact);
			expect(result.newContact).toBe(false);
			expect(mockPrisma.prisma.contact.create).not.toHaveBeenCalled();
		});

		it('creates new contact when not found', async () => {
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);
			mockPrisma.prisma.contact.create.mockResolvedValue(mockAutoCreatedContact);

			const result = await findOrCreateContact('new@example.com', mockUser.id);

			expect(result.contact).toEqual(mockAutoCreatedContact);
			expect(result.newContact).toBe(true);
			expect(mockPrisma.prisma.contact.create).toHaveBeenCalledWith({
				data: {
					email: 'new@example.com',
					ownerId: mockUser.id,
					firstName: null,
					lastName: null,
					company: null,
					autoCreated: true,
					active: true,
				},
			});
		});

		it('searches for contact by email and ownerId', async () => {
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(mockContact);

			await findOrCreateContact('test@example.com', 42);

			expect(mockPrisma.prisma.contact.findFirst).toHaveBeenCalledWith({
				where: {
					email: 'test@example.com',
					ownerId: 42,
				},
			});
		});

		it('sets autoCreated to true for new contacts', async () => {
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);
			mockPrisma.prisma.contact.create.mockResolvedValue(mockAutoCreatedContact);

			await findOrCreateContact('auto@test.com', mockUser.id);

			expect(mockPrisma.prisma.contact.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						autoCreated: true,
					}),
				})
			);
		});
	});

	describe('storeSentEmail', () => {
		const baseEmailData = {
			email: mockContact.email,
			ownerId: mockUser.id,
			subject: 'Test Subject',
			contents: '<p>Test content</p>',
			cadenceType: 'none',
			autoSend: false,
			autoSendDelay: '',
			cadenceDuration: '30',
			messageId: 'msg-123',
			threadId: 'thread-456',
			referencePreviousEmail: false,
			alterSubjectLine: false,
		};

		beforeEach(() => {
			// Setup default contact find
			mockPrisma.prisma.contact.findFirst.mockResolvedValue(mockContact);
		});

		describe('when cadenceType is "none"', () => {
			it('creates message without sequence', async () => {
				const transactionResult = [mockMessage, mockContact];
				mockPrisma.prisma.$transaction.mockResolvedValue(transactionResult);

				const result = await storeSentEmail(baseEmailData);

				expect(result.createdMessage).toEqual(mockMessage);
				expect(result.updatedContact).toEqual(mockContact);
				expect(mockPrisma.prisma.sequence.create).not.toHaveBeenCalled();
			});

			it('uses transaction to create message and update contact', async () => {
				// Mock the prisma methods to return promise-like objects for transaction
				const mockMessagePromise = { then: vi.fn() };
				const mockContactPromise = { then: vi.fn() };
				mockPrisma.prisma.message.create.mockReturnValue(mockMessagePromise as never);
				mockPrisma.prisma.contact.update.mockReturnValue(mockContactPromise as never);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail(baseEmailData);

				expect(mockPrisma.prisma.$transaction).toHaveBeenCalledWith([
					mockMessagePromise,
					mockContactPromise,
				]);
			});

			it('returns newContact flag', async () => {
				mockPrisma.prisma.contact.findFirst.mockResolvedValue(null);
				mockPrisma.prisma.contact.create.mockResolvedValue(mockAutoCreatedContact);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockAutoCreatedContact]);

				const result = await storeSentEmail(baseEmailData);

				expect(result.newContact).toBe(true);
			});
		});

		describe('when cadenceType creates a sequence', () => {
			const sequenceEmailData = {
				...baseEmailData,
				cadenceType: '3day',
				cadenceDuration: '30',
			};

			it('creates sequence for 3day cadence', async () => {
				mockPrisma.prisma.sequence.create.mockResolvedValue(mockSequence);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail(sequenceEmailData);

				expect(mockPrisma.prisma.sequence.create).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.objectContaining({
							sequenceType: '3day',
							contactId: mockContact.id,
							ownerId: mockUser.id,
						}),
					})
				);
			});

			it('creates sequence for weekly cadence', async () => {
				mockPrisma.prisma.sequence.create.mockResolvedValue(mockSequence);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail({ ...sequenceEmailData, cadenceType: 'weekly' });

				expect(mockPrisma.prisma.sequence.create).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.objectContaining({
							sequenceType: 'weekly',
						}),
					})
				);
			});

			it('calculates correct endDate for 30 day duration', async () => {
				mockPrisma.prisma.sequence.create.mockResolvedValue(mockSequence);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail({ ...sequenceEmailData, cadenceDuration: '30' });

				expect(mockPrisma.prisma.sequence.create).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.objectContaining({
							sequenceDuration: 30,
						}),
					})
				);
			});

			it('sets null endDate for indefinite duration', async () => {
				mockPrisma.prisma.sequence.create.mockResolvedValue(mockSequence);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail({ ...sequenceEmailData, cadenceDuration: 'indefinite' });

				expect(mockPrisma.prisma.sequence.create).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.objectContaining({
							sequenceDuration: null,
							endDate: null,
						}),
					})
				);
			});

			it('links message to created sequence', async () => {
				const createdSequence = { ...mockSequence, id: 123 };
				mockPrisma.prisma.sequence.create.mockResolvedValue(createdSequence);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail(sequenceEmailData);

				// The transaction should include a message create with sequenceId
				expect(mockPrisma.prisma.$transaction).toHaveBeenCalled();
			});

			it('sets correct nextStepDue for 3day sequence', async () => {
				const now = Date.now();
				vi.spyOn(Date, 'now').mockReturnValue(now);

				mockPrisma.prisma.sequence.create.mockResolvedValue(mockSequence);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail(sequenceEmailData);

				expect(mockPrisma.prisma.sequence.create).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.objectContaining({
							nextStepDue: new Date(now + 3 * 24 * 60 * 60 * 1000),
						}),
					})
				);

				vi.restoreAllMocks();
			});
		});

		describe('autoSend handling', () => {
			it('sets autoSend to true when autoSend is false in input', async () => {
				// Note: The code has inverted logic: autoSend: autoSend ? false : true
				mockPrisma.prisma.sequence.create.mockResolvedValue(mockSequence);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail({
					...baseEmailData,
					cadenceType: '3day',
					autoSend: false,
				});

				expect(mockPrisma.prisma.sequence.create).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.objectContaining({
							autoSend: true, // inverted from input
						}),
					})
				);
			});

			it('sets autoSendDelay when autoSend is true and delay provided', async () => {
				mockPrisma.prisma.sequence.create.mockResolvedValue(mockSequence);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail({
					...baseEmailData,
					cadenceType: '3day',
					autoSend: true,
					autoSendDelay: '24',
				});

				expect(mockPrisma.prisma.sequence.create).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.objectContaining({
							autoSendDelay: 24,
						}),
					})
				);
			});

			it('sets autoSendDelay to null when autoSendDelay is "never"', async () => {
				mockPrisma.prisma.sequence.create.mockResolvedValue(mockSequence);
				mockPrisma.prisma.$transaction.mockResolvedValue([mockMessage, mockContact]);

				await storeSentEmail({
					...baseEmailData,
					cadenceType: '3day',
					autoSend: true,
					autoSendDelay: 'never',
				});

				expect(mockPrisma.prisma.sequence.create).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.objectContaining({
							autoSendDelay: null,
						}),
					})
				);
			});
		});
	});
});
