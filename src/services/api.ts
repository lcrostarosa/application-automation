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

// Sequence API functions
export const sequenceAPI = {
	readAll: () => apiCall('/api/sequences', { method: 'GET' }),
	readAllByContactId: (contactId: number) =>
		apiCall(`/api/sequences/contact/${contactId}`, {
			method: 'GET',
		}),
	readUnique: (sequenceId: number) =>
		apiCall(`/api/sequences/${sequenceId}`, {
			method: 'GET',
		}),
	deactivate: (sequenceId: number) =>
		apiCall(`/api/sequences/${sequenceId}`, {
			method: 'PUT',
		}),
};

// Messages API functions
export const messageAPI = {
	readStandaloneByContactId: (contactId: number) =>
		apiCall(`/api/messages/contact/${contactId}/standalone`, {
			method: 'GET',
		}),
	readAllByContactId: (contactId: number) =>
		apiCall(`/api/messages/contact/${contactId}`, {
			method: 'GET',
		}),
	getAllPending: () =>
		apiCall('/api/messages/pending', {
			method: 'GET',
		}),
	approveMessage: (messageId: number) =>
		apiCall(`/api/messages/${messageId}/approve`, {
			method: 'PUT',
		}),
	updateMessage: (messageId: number, contents: string, subject: string) =>
		apiCall(`/api/messages/${messageId}/update`, {
			method: 'PUT',
			body: JSON.stringify({ contents, subject }),
		}),
};
