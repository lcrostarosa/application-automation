import { Ratelimit } from '@upstash/ratelimit';
import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';

// ============================================
// Configuration from environment variables
// ============================================
const isEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

const config = {
	webhook: {
		maxRequests: parseInt(process.env.RATE_LIMIT_WEBHOOK_MAX || '100'),
		windowSec: parseInt(process.env.RATE_LIMIT_WEBHOOK_WINDOW || '60'),
	},
	api: {
		maxRequests: parseInt(process.env.RATE_LIMIT_API_MAX || '60'),
		windowSec: parseInt(process.env.RATE_LIMIT_API_WINDOW || '60'),
	},
	sendEmail: {
		maxRequests: parseInt(process.env.RATE_LIMIT_EMAIL_MAX || '100'),
		windowSec: parseInt(process.env.RATE_LIMIT_EMAIL_WINDOW || '3600'),
	},
} as const;

export const RATE_LIMITS = config;
export type RateLimitType = keyof typeof config;

// ============================================
// Redis client factory
// ============================================
type RedisClient = UpstashRedis | IORedis;
let redisClient: RedisClient | null = null;

function getRedisClient(): RedisClient {
	if (redisClient) return redisClient;

	// Option 1: Standard Redis (local/docker) - takes precedence
	if (process.env.REDIS_URL) {
		redisClient = new IORedis(process.env.REDIS_URL);
		return redisClient;
	}

	// Option 2: Upstash Redis (serverless/production)
	if (process.env.UPSTASH_REDIS_REST_URL) {
		redisClient = new UpstashRedis({
			url: process.env.UPSTASH_REDIS_REST_URL,
			token: process.env.UPSTASH_REDIS_REST_TOKEN!,
		});
		return redisClient;
	}

	throw new Error(
		'Redis not configured. Set either REDIS_URL (for local/docker) or UPSTASH_REDIS_REST_URL (for serverless).'
	);
}

// ============================================
// Rate limiters (lazy initialization)
// ============================================
const rateLimiters: Partial<Record<RateLimitType, Ratelimit>> = {};

function getRateLimiter(type: RateLimitType): Ratelimit {
	if (!rateLimiters[type]) {
		const cfg = config[type];
		const redis = getRedisClient();

		rateLimiters[type] = new Ratelimit({
			redis: redis as Parameters<typeof Ratelimit>[0]['redis'],
			limiter: Ratelimit.slidingWindow(cfg.maxRequests, `${cfg.windowSec} s`),
			prefix: `ratelimit:${type}`,
		});
	}
	return rateLimiters[type]!;
}

// ============================================
// Main API
// ============================================
export async function checkRateLimit(
	identifier: string,
	limitType: RateLimitType
): Promise<{
	allowed: boolean;
	headers: {
		'X-RateLimit-Limit': string;
		'X-RateLimit-Remaining': string;
		'X-RateLimit-Reset': string;
	};
}> {
	// If disabled, always allow
	if (!isEnabled) {
		const cfg = config[limitType];
		return {
			allowed: true,
			headers: {
				'X-RateLimit-Limit': String(cfg.maxRequests),
				'X-RateLimit-Remaining': String(cfg.maxRequests),
				'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + cfg.windowSec),
			},
		};
	}

	const limiter = getRateLimiter(limitType);
	const { success, limit, remaining, reset } = await limiter.limit(identifier);

	return {
		allowed: success,
		headers: {
			'X-RateLimit-Limit': String(limit),
			'X-RateLimit-Remaining': String(remaining),
			'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
		},
	};
}

/**
 * Helper to extract client IP from request.
 * Handles common proxy headers.
 */
export function getClientIp(request: Request): string {
	// Check common proxy headers
	const forwardedFor = request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		// Take the first IP in the chain (original client)
		return forwardedFor.split(',')[0].trim();
	}

	const realIp = request.headers.get('x-real-ip');
	if (realIp) {
		return realIp;
	}

	// Fallback - this may not work in all environments
	return 'unknown';
}
