// User fixtures for testing

export interface MockUser {
	id: number;
	auth0Id: string;
	email: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	googleAccessToken: string | null;
	googleRefreshToken: string | null;
}

// Standard test user
export const mockUser: MockUser = {
	id: 1,
	auth0Id: 'auth0|test-user-123',
	email: 'test@example.com',
	name: 'Test User',
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-01T00:00:00Z'),
	googleAccessToken: 'mock-google-access-token',
	googleRefreshToken: 'mock-google-refresh-token',
};

// Admin user for testing admin functionality
export const mockAdminUser: MockUser = {
	id: 2,
	auth0Id: 'auth0|admin-user-456',
	email: 'admin@example.com',
	name: 'Admin User',
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-01T00:00:00Z'),
	googleAccessToken: 'mock-admin-google-access-token',
	googleRefreshToken: 'mock-admin-google-refresh-token',
};

// User without Google tokens (incomplete setup)
export const mockUserWithoutGoogle: MockUser = {
	id: 3,
	auth0Id: 'auth0|no-google-789',
	email: 'nogoogle@example.com',
	name: 'No Google User',
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-01T00:00:00Z'),
	googleAccessToken: null,
	googleRefreshToken: null,
};

// Factory function for creating custom users
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
	return {
		...mockUser,
		id: Math.floor(Math.random() * 10000),
		...overrides,
	};
}
