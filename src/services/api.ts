// Types imports
import { ContactData, ContactUpdateData } from '@/types/contactTypes';
import { SentEmailData } from '@/types/emailTypes';

// Generic fetch wrapper
const apiCall = async (url: string, options: RequestInit = {}) => {
	const response = await fetch(url, {
		headers: { 'Content-Type': 'application/json' },
		...options,
	});

	const data = await response.json();

	if (!response.ok) {
		const error = new Error(data.error || `HTTP ${response.status}`);
		(error as any).duplicate = data.duplicate || false;
		(error as any).status = response.status;
		(error as any).responseData = data;
		throw error;
	}

	return data;
};

// Email API functions
export const emailAPI = {
	send: (emailData: SentEmailData) =>
		apiCall('/api/send-email', {
			method: 'POST',
			body: JSON.stringify(emailData),
		}),
};

// Replies API functions
export const repliesAPI = {
	getAll: () => apiCall('/api/replies'),
	checkForNew: () => apiCall('/api/check-replies', { method: 'POST' }),
};

// Contact API functions
export const contactAPI = {
	create: (contactData: ContactData) =>
		apiCall('/api/contacts', {
			method: 'POST',
			body: JSON.stringify(contactData),
		}),
	read: () =>
		apiCall('/api/contacts', {
			method: 'GET',
		}),
	readUnique: (id: number) =>
		apiCall(`/api/contacts/${id}`, {
			method: 'GET',
		}),
	update: (contactData: ContactUpdateData) =>
		apiCall(`/api/contacts/${contactData.id}`, {
			method: 'PUT',
			body: JSON.stringify(contactData),
		}),
	delete: (id: number) =>
		apiCall(`/api/contacts/${id}`, {
			method: 'DELETE',
		}),
};
