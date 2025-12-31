import { contactAPI } from '@/services/api';
import { useAppContext } from '@/app/context/AppContext';
import {
	ContactData,
	ContactResponse,
	ContactsResponse,
	ContactUpdateData,
} from '@/types/contactTypes';

// Tanstack React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useContactsGetAll = () => {
	return useQuery<ContactsResponse>({
		queryKey: ['contacts-get-all'],
		queryFn: contactAPI.read,
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

			alert(
				`Contact created successfully! ${response.contact.firstName} ${response.contact.lastName}`
			);
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
	const { setDuplicateContact } = useAppContext();
	const queryClient = useQueryClient();

	return useMutation<ContactResponse, Error, ContactUpdateData>({
		mutationFn: contactAPI.update,

		onSuccess: (response: ContactResponse, updateData: ContactUpdateData) => {
			setDuplicateContact(false);
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
				// If server only returns contact id or similar, simply invalidate to refetch authoritative data
				queryClient.invalidateQueries({ queryKey: ['contacts-get-all'] });
			}

			alert(
				`Contact updated successfully! ${response.contact.firstName} ${response.contact.lastName}`
			);
		},

		onError: (error: Error) => {
			console.error('Failed to update contact:', error);
			alert(`Failed to update contact: ${error.message}`);
		},

		onSettled: () => {
			// Ensure eventual consistency
			queryClient.invalidateQueries({ queryKey: ['contacts-get-all'] });
		},
	});
};
