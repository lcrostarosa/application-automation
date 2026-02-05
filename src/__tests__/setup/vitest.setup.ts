import { vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock environment variables
vi.stubEnv('AUTH0_SECRET', 'test-auth0-secret');
vi.stubEnv('AUTH0_BASE_URL', 'http://localhost:3000');
vi.stubEnv('AUTH0_ISSUER_BASE_URL', 'https://test.auth0.com');
vi.stubEnv('AUTH0_CLIENT_ID', 'test-client-id');
vi.stubEnv('AUTH0_CLIENT_SECRET', 'test-client-secret');
vi.stubEnv('GOOGLE_CLIENT_ID', 'test-google-client-id');
vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-google-client-secret');
vi.stubEnv('GOOGLE_REFRESH_TOKEN', 'test-google-refresh-token');
vi.stubEnv('OPENAI_API_KEY', 'test-openai-api-key');
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		contact: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		message: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		sequence: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

// Mock Auth0
vi.mock('@/lib/auth0', () => ({
	auth0: {
		getSession: vi.fn(),
	},
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
	redirect: vi.fn(),
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
	})),
	usePathname: vi.fn(() => '/'),
	useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Clear mocks after each test
afterEach(() => {
	vi.clearAllMocks();
});

// Reset modules before each test to ensure clean state
beforeEach(() => {
	vi.resetModules();
});
