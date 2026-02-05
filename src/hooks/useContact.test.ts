import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useContactsGetAll, useContactGetUnique, useContactCreate } from './useContact';
import { mockContact, createMockContactList } from '@/__tests__/fixtures/contacts';

// Mock the API module
vi.mock('@/services/api', () => ({
	contactAPI: {
		read: vi.fn(),
		readUnique: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
}));

// Mock AppContext
vi.mock('@/app/context/AppContext', () => ({
	useAppContext: vi.fn(() => ({
		setDuplicateContact: vi.fn(),
		duplicateContact: false,
	})),
}));

// Get mocked API
const mockContactAPI = vi.mocked(await import('@/services/api')).contactAPI;

// Helper to create wrapper with QueryClient
function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});

	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(QueryClientProvider, { client: queryClient }, children);
	};
}

describe('useContact hooks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('useContactsGetAll', () => {
		it('fetches all contacts successfully', async () => {
			const contacts = createMockContactList(3);
			mockContactAPI.read.mockResolvedValue({ contacts });

			const { result } = renderHook(() => useContactsGetAll(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.contacts).toEqual(contacts);
			expect(mockContactAPI.read).toHaveBeenCalled();
		});

		it('returns loading state initially', () => {
			mockContactAPI.read.mockReturnValue(new Promise(() => {})); // Never resolves

			const { result } = renderHook(() => useContactsGetAll(), {
				wrapper: createWrapper(),
			});

			expect(result.current.isLoading).toBe(true);
		});

		it('handles error state', async () => {
			mockContactAPI.read.mockRejectedValue(new Error('Network error'));

			const { result } = renderHook(() => useContactsGetAll(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error?.message).toBe('Network error');
		});

		it('uses correct query key', async () => {
			mockContactAPI.read.mockResolvedValue({ contacts: [] });

			const { result } = renderHook(() => useContactsGetAll(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			// The hook should use 'contacts-get-all' as the query key
			expect(mockContactAPI.read).toHaveBeenCalledTimes(1);
		});
	});

	describe('useContactGetUnique', () => {
		it('fetches single contact by id', async () => {
			mockContactAPI.readUnique.mockResolvedValue(mockContact);

			const { result } = renderHook(() => useContactGetUnique(1), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toEqual(mockContact);
			expect(mockContactAPI.readUnique).toHaveBeenCalledWith(1);
		});

		it('handles different contact IDs', async () => {
			mockContactAPI.readUnique.mockResolvedValue(mockContact);

			const { result } = renderHook(() => useContactGetUnique(42), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockContactAPI.readUnique).toHaveBeenCalledWith(42);
		});

		it('returns loading state initially', () => {
			mockContactAPI.readUnique.mockReturnValue(new Promise(() => {}));

			const { result } = renderHook(() => useContactGetUnique(1), {
				wrapper: createWrapper(),
			});

			expect(result.current.isLoading).toBe(true);
		});

		it('handles error when contact not found', async () => {
			mockContactAPI.readUnique.mockRejectedValue(new Error('Contact not found'));

			const { result } = renderHook(() => useContactGetUnique(999), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error?.message).toBe('Contact not found');
		});
	});

	describe('useContactCreate', () => {
		it('creates contact successfully', async () => {
			const newContact = { ...mockContact, id: 100 };
			mockContactAPI.create.mockResolvedValue({ success: true, contact: newContact });

			const { result } = renderHook(() => useContactCreate(), {
				wrapper: createWrapper(),
			});

			// Trigger mutation
			result.current.mutate({
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockContactAPI.create).toHaveBeenCalledWith({
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
			});
		});

		it('handles duplicate contact response', async () => {
			const mockSetDuplicateContact = vi.fn();
			vi.mocked(await import('@/app/context/AppContext')).useAppContext.mockReturnValue({
				setDuplicateContact: mockSetDuplicateContact,
				duplicateContact: false,
			} as never);

			mockContactAPI.create.mockResolvedValue({
				success: false,
				duplicate: true,
				existingContact: mockContact,
			});

			const { result } = renderHook(() => useContactCreate(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				firstName: 'John',
				lastName: 'Doe',
				email: mockContact.email,
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockSetDuplicateContact).toHaveBeenCalledWith(true);
		});

		it('handles error on create failure', async () => {
			mockContactAPI.create.mockRejectedValue(new Error('Create failed'));

			const { result } = renderHook(() => useContactCreate(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error?.message).toBe('Create failed');
		});

		it('sends all contact fields to API', async () => {
			mockContactAPI.create.mockResolvedValue({ success: true, contact: mockContact });

			const { result } = renderHook(() => useContactCreate(), {
				wrapper: createWrapper(),
			});

			const contactData = {
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

			result.current.mutate(contactData);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockContactAPI.create).toHaveBeenCalledWith(contactData);
		});
	});
});
