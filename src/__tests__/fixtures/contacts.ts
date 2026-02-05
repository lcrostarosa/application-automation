// Contact fixtures for testing
import { ContactFromDB } from '@/types/contactTypes';

// Standard test contact
export const mockContact: ContactFromDB = {
	id: 1,
	email: 'contact@example.com',
	ownerId: 1,
	firstName: 'John',
	lastName: 'Doe',
	company: 'Acme Inc',
	title: 'CEO',
	phone: '+1234567890',
	linkedIn: 'https://linkedin.com/in/johndoe',
	importance: 5,
	reasonForEmail: 'Partnership opportunity',
	active: true,
	lastActivity: new Date('2024-01-15T10:00:00Z'),
	replied: false,
	validEmail: true,
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-15T10:00:00Z'),
	autoCreated: false,
};

// Contact who has replied
export const mockContactReplied: ContactFromDB = {
	...mockContact,
	id: 2,
	email: 'replied@example.com',
	firstName: 'Jane',
	lastName: 'Smith',
	replied: true,
	lastActivity: new Date('2024-01-20T10:00:00Z'),
};

// Auto-created contact (minimal info)
export const mockAutoCreatedContact: ContactFromDB = {
	id: 3,
	email: 'auto@example.com',
	ownerId: 1,
	firstName: null,
	lastName: null,
	company: null,
	title: null,
	phone: null,
	linkedIn: null,
	importance: null,
	reasonForEmail: null,
	active: true,
	lastActivity: null,
	replied: false,
	validEmail: null,
	createdAt: new Date('2024-01-10T00:00:00Z'),
	updatedAt: new Date('2024-01-10T00:00:00Z'),
	autoCreated: true,
};

// Inactive contact
export const mockInactiveContact: ContactFromDB = {
	...mockContact,
	id: 4,
	email: 'inactive@example.com',
	firstName: 'Inactive',
	lastName: 'Contact',
	active: false,
};

// Factory function for creating custom contacts
export function createMockContact(
	overrides: Partial<ContactFromDB> = {}
): ContactFromDB {
	return {
		...mockContact,
		id: Math.floor(Math.random() * 10000),
		email: `contact-${Date.now()}@example.com`,
		...overrides,
	};
}

// Create a list of contacts for testing
export function createMockContactList(count: number): ContactFromDB[] {
	return Array.from({ length: count }, (_, i) =>
		createMockContact({
			id: i + 1,
			email: `contact${i + 1}@example.com`,
			firstName: `Contact`,
			lastName: `${i + 1}`,
		})
	);
}
