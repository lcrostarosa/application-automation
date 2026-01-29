import { contactAPI } from '@/services/api';
import { useAppContext } from '@/app/context/AppContext';
import {
	ContactData,
	ContactFromDB,
	ContactResponse,
	ContactsResponse,
	ContactUpdateData,
} from '@/types/contactTypes';

// Tanstack React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useContactGetUnique = (id: number) => {
	return useQuery<ContactFromDB>({
		queryKey: ['contact-get-unique', id],
		queryFn: () => contactAPI.readUnique(id),
		refetchOnWindowFocus: true,
		refetchInterval: 1000 * 30, // Refetch every 30 seconds
	});
};

export const useContactsGetAll = () => {
	return useQuery<ContactsResponse>({
		queryKey: ['contacts-get-all'],
		queryFn: contactAPI.read,
		refetchOnWindowFocus: true,
		refetchInterval: 1000 * 30, // Refetch every 30 seconds
	});
};

export const useContactCreate = () => {
	const { setDuplicateContact } = useAppContext();
	const queryClient = useQueryClient();

	return useMutation<ContactResponse, Error, ContactData>({
		mutationFn: contactAPI.create,

		onSuccess: (response: ContactResponse, _contactData: ContactData) => {
			// If API reports duplicate, set duplicate mode and do not add anything
			if (response.success === false && response.duplicate) {
				setDuplicateContact(true);
				return;
			}

			// Normal success: add the new contact to the cache
			if (response?.contact) {
				queryClient.setQueryData<ContactsResponse>(
					['contacts-get-all'],
					(old: any) => {
						const prev = old?.contacts || [];
						return {
							contacts: [response.contact, ...prev],
						};
					}
				);
			} else {
				// If server only returns contact id or similar, simply invalidate to refetch authoritative data
				queryClient.invalidateQueries({ queryKey: ['contacts-get-all'] });
			}
		},

		onError: (error: Error) => {
			console.error('Failed to create contact:', error);
			alert(`Failed to create contact: ${error.message}`);
		},

		onSettled: () => {
			// Ensure eventual consistency
			queryClient.invalidateQueries({ queryKey: ['contacts-get-all'] });
		},
	});
};

export const useContactUpdate = () => {
	const { duplicateContact, setDuplicateContact } = useAppContext();
	const queryClient = useQueryClient();

	return useMutation<ContactResponse, Error, ContactUpdateData>({
		mutationFn: contactAPI.update,

		onSuccess: (response: ContactResponse, updateData: ContactUpdateData) => {
			duplicateContact ? setDuplicateContact(false) : null;
			// Only update cache if server returns the updated contact
			if (response?.contact) {
				queryClient.setQueryData<ContactsResponse>(
					['contacts-get-all'],
					(old: any) => {
						const prev = old?.contacts || [];
						return {
							contacts: prev.map((contact: any) =>
								contact.id === updateData.id ? response.contact : contact
							),
						};
					}
				);
			} else {
				// If server does not return updated contact, invalidate to refetch authoritative data
				queryClient.invalidateQueries({ queryKey: ['contacts-get-all'] });
			}
			// makes sure unique contact query is up to date
			queryClient.invalidateQueries({
				queryKey: ['contact-get-unique', updateData.id],
			});
		},

		onError: (error: Error) => {
			if (error.message === 'Contact with this email already exists') {
				setDuplicateContact(true);
				return;
			}
			console.error('Failed to update contact:', error);
			alert(`Failed to update contact: ${error.message}`);
		},

		onSettled: (_data, _error, variables) => {
			// Ensure eventual consistency for both queries
			queryClient.invalidateQueries({ queryKey: ['contacts-get-all'] });
			if (variables?.id) {
				queryClient.invalidateQueries({
					queryKey: ['contact-get-unique', variables.id],
				});
			}
		},
	});
};

export const useContactDelete = () => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, number>({
		mutationFn: contactAPI.delete,

		onSuccess: (_data: void, contactId: number) => {
			// Remove the deleted contact from the cache
			queryClient.setQueryData<ContactsResponse>(
				['contacts-get-all'],
				(old: any) => {
					const prev = old?.contacts || [];
					return {
						contacts: prev.filter((contact: any) => contact.id !== contactId),
					};
				}
			);
		},

		onError: (error: Error) => {
			console.error('Failed to delete contact:', error);
			alert(`Failed to delete contact: ${error.message}`);
		},

		onSettled: () => {
			// Can blanket invalidate all query keys because contact deletion is rare and touches literally everything
			queryClient.invalidateQueries();
		},
	});
};
