import { vi } from 'vitest';
import { mockDeep, DeepMockProxy } from 'vitest-mock-extended';

// Import the PrismaClient type from the generated client
type PrismaClient = {
	user: {
		findUnique: ReturnType<typeof vi.fn>;
		findFirst: ReturnType<typeof vi.fn>;
		findMany: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	contact: {
		findUnique: ReturnType<typeof vi.fn>;
		findFirst: ReturnType<typeof vi.fn>;
		findMany: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	message: {
		findUnique: ReturnType<typeof vi.fn>;
		findFirst: ReturnType<typeof vi.fn>;
		findMany: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	sequence: {
		findUnique: ReturnType<typeof vi.fn>;
		findFirst: ReturnType<typeof vi.fn>;
		findMany: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	$transaction: ReturnType<typeof vi.fn>;
};

export const prismaMock = mockDeep<PrismaClient>();

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

// Helper to reset all prisma mocks
export function resetPrismaMocks() {
	vi.clearAllMocks();
}
