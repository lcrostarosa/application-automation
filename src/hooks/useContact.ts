import { useMutation } from './api';
import { contactAPI } from '@/services/api';

interface ContactData {
	first: string;
	last: string;
	company?: string;
	title?: string;
	email: string;
	phone?: string;
	linkedin?: string;
	importance: string;
	associatedRole?: string;
}

interface ContactResponse {
	success: boolean;
	contact: {
		id: number;
		firstName: string;
		lastName: string;
		company?: string;
		title?: string;
		email: string;
		phone?: string;
		linkedIn?: string;
		importance?: number;
		associatedRole?: string;
		createdAt: string;
		updatedAt: string;
	};
}

export const useContactCreate = () => {
	return useMutation<ContactResponse, ContactData>(contactAPI.create, {
		onSuccess: (response, contactData) => {
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
