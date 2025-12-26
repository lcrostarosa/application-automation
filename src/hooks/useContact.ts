import { useMutation, useQuery } from './api';
import { contactAPI } from '@/services/api';
import { useAppContext } from '@/app/context/AppContext';
import {
	ContactData,
	ContactResponse,
	ContactsResponse,
	ContactUpdateData,
} from '@/types/contactTypes';

export const useContactsGetAll = () => {
	return useQuery<ContactsResponse>('contacts-get-all', contactAPI.read, {
		immediate: true,
		onSuccess: (response) => {
			console.log('Contacts fetched successfully:', response.contacts);
		},
		onError: (error) => {
			console.error('Failed to fetch contacts:', error);
		},
	});
};

export const useContactCreate = () => {
	const { setDuplicateContact } = useAppContext();

	return useMutation<ContactResponse, ContactData>(contactAPI.create, {
		onSuccess: (response, contactData) => {
			if (response.success === false && response.duplicate) {
				setDuplicateContact(true);
				return;
			}

			console.log('Contact created successfully:', response.contact);
			alert(
				`Contact created successfully! ${response.contact.firstName} ${response.contact.lastName}`
			);
		},
		onError: (error, contactData) => {
			console.error('Failed to create contact:', error);
			alert(`Failed to create contact: ${error.message}`);
		},
	});
};

export const useContactUpdate = () => {
	const { setDuplicateContact } = useAppContext();

	return useMutation<ContactResponse, ContactUpdateData>(contactAPI.update, {
		onSuccess: (response, contactData) => {
			setDuplicateContact(false);
			console.log('Contact updated successfully:', response.contact);
			alert(
				`Contact updated successfully! ${response.contact.firstName} ${response.contact.lastName}`
			);
		},
		onError: (error, contactData) => {
			console.error('Failed to update contact:', error);
			alert(`Failed to update contact: ${error.message}`);
		},
	});
};
