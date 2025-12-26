// Types imports
import { ContactData, ContactUpdateData } from '@/types/contactTypes';

// Generic fetch wrapper
const apiCall = async (url: string, options: RequestInit = {}) => {
	const response = await fetch(url, {
		headers: { 'Content-Type': 'application/json' },
		...options,
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || `HTTP ${response.status}`);
	}

	return data;
};

// Email API functions
export const emailAPI = {
	send: (emailData: { to: string; subject: string; body: string }) =>
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
	update: (contactData: ContactUpdateData) =>
		apiCall(`/api/contacts/${contactData.id}`, {
			method: 'PUT',
			body: JSON.stringify(contactData),
		}),
};
