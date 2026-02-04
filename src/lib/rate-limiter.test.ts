import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Store the mock function at module level so it can be used by the mock factory
let mockLimitFn = vi.fn();

// Mock the Redis clients
vi.mock('@upstash/redis', () => ({
	Redis: vi.fn(function() {
		return {};
	}),
}));

vi.mock('ioredis', () => {
	return {
		default: vi.fn(function() {
			return {};
		}),
	};
});

// Mock @upstash/ratelimit
vi.mock('@upstash/ratelimit', () => {
	const MockRatelimit = vi.fn(function() {
		return {
			limit: (...args: unknown[]) => mockLimitFn(...args),
		};
	}) as unknown as { new (): { limit: (...args: unknown[]) => unknown }; slidingWindow: () => object };
	MockRatelimit.slidingWindow = () => ({});

	return { Ratelimit: MockRatelimit };
});

// Import after mocks are set up
import { getClientIp, RATE_LIMITS } from './rate-limiter';

describe('checkRateLimit', () => {
	beforeEach(() => {
		vi.resetModules();
		mockLimitFn = vi.fn(); // Reset the mock function
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('should allow requests when rate limiting is disabled', async () => {
		vi.stubEnv('RATE_LIMIT_ENABLED', 'false');
		vi.stubEnv('REDIS_URL', 'redis://localhost:6379');

		// Re-import to get fresh module with updated env
		const { checkRateLimit } = await import('./rate-limiter');

		const result = await checkRateLimit('test-user', 'api');

		expect(result.allowed).toBe(true);
		expect(result.headers['X-RateLimit-Limit']).toBe('60');
		expect(result.headers['X-RateLimit-Remaining']).toBe('60');
		// mockLimitFn should not be called when disabled
		expect(mockLimitFn).not.toHaveBeenCalled();
	});

	it('should return rate limit headers when enabled', async () => {
		vi.stubEnv('RATE_LIMIT_ENABLED', 'true');
		vi.stubEnv('REDIS_URL', 'redis://localhost:6379');

		mockLimitFn.mockResolvedValue({
			success: true,
			limit: 60,
			remaining: 59,
			reset: Date.now() + 60000,
		});

		const { checkRateLimit } = await import('./rate-limiter');

		const result = await checkRateLimit('test-user', 'api');

		expect(result.headers).toHaveProperty('X-RateLimit-Limit');
		expect(result.headers).toHaveProperty('X-RateLimit-Remaining');
		expect(result.headers).toHaveProperty('X-RateLimit-Reset');
	});

	it('should block requests when rate limit exceeded', async () => {
		vi.stubEnv('RATE_LIMIT_ENABLED', 'true');
		vi.stubEnv('REDIS_URL', 'redis://localhost:6379');

		mockLimitFn.mockResolvedValue({
			success: false,
			limit: 60,
			remaining: 0,
			reset: Date.now() + 60000,
		});

		const { checkRateLimit } = await import('./rate-limiter');

		const result = await checkRateLimit('test-user', 'api');

		expect(result.allowed).toBe(false);
		expect(result.headers['X-RateLimit-Remaining']).toBe('0');
	});
});

describe('RATE_LIMITS configuration', () => {
	it('should have correct defaults for webhook limits', () => {
		expect(RATE_LIMITS.webhook.maxRequests).toBe(100);
		expect(RATE_LIMITS.webhook.windowSec).toBe(60);
	});

	it('should have correct defaults for api limits', () => {
		expect(RATE_LIMITS.api.maxRequests).toBe(60);
		expect(RATE_LIMITS.api.windowSec).toBe(60);
	});

	it('should have correct defaults for sendEmail limits', () => {
		expect(RATE_LIMITS.sendEmail.maxRequests).toBe(100);
		expect(RATE_LIMITS.sendEmail.windowSec).toBe(3600);
	});
});

describe('getClientIp', () => {
	it('should extract IP from x-forwarded-for header', () => {
		const request = new Request('https://example.com', {
			headers: {
				'x-forwarded-for': '192.168.1.1, 10.0.0.1',
			},
		});

		const ip = getClientIp(request);
		expect(ip).toBe('192.168.1.1');
	});

	it('should extract IP from x-real-ip header', () => {
		const request = new Request('https://example.com', {
			headers: {
				'x-real-ip': '192.168.1.2',
			},
		});

		const ip = getClientIp(request);
		expect(ip).toBe('192.168.1.2');
	});

	it('should prefer x-forwarded-for over x-real-ip', () => {
		const request = new Request('https://example.com', {
			headers: {
				'x-forwarded-for': '192.168.1.1',
				'x-real-ip': '192.168.1.2',
			},
		});

		const ip = getClientIp(request);
		expect(ip).toBe('192.168.1.1');
	});

	it('should return unknown when no IP headers present', () => {
		const request = new Request('https://example.com');

		const ip = getClientIp(request);
		expect(ip).toBe('unknown');
	});
});
