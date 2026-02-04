/**
 * Custom error classes for the application.
 * Use these instead of generic Error for better error handling and type safety.
 */

/**
 * Base class for all application errors.
 * Provides a consistent interface for error handling.
 */
export class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode = 500, isOperational = true) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends AppError {
	constructor(resource: string, id?: string | number) {
		const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
		super(message, 404);
	}
}

/**
 * Error thrown when a request is invalid or malformed.
 */
export class ValidationError extends AppError {
	public readonly field?: string;

	constructor(message: string, field?: string) {
		super(message, 400);
		this.field = field;
	}
}

/**
 * Error thrown when authentication fails.
 */
export class AuthenticationError extends AppError {
	constructor(message = 'Authentication required') {
		super(message, 401);
	}
}

/**
 * Error thrown when user lacks permission for an action.
 */
export class AuthorizationError extends AppError {
	constructor(message = 'Permission denied') {
		super(message, 403);
	}
}

/**
 * Error thrown when rate limit is exceeded.
 */
export class RateLimitError extends AppError {
	public readonly retryAfter?: number;

	constructor(message = 'Too many requests', retryAfter?: number) {
		super(message, 429);
		this.retryAfter = retryAfter;
	}
}

/**
 * Error thrown when there's a conflict with existing data.
 */
export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, 409);
	}
}

/**
 * Error thrown when an external service fails.
 */
export class ExternalServiceError extends AppError {
	public readonly service: string;

	constructor(service: string, message: string) {
		super(`${service}: ${message}`, 502);
		this.service = service;
	}
}

/**
 * Error thrown when Redis connection or operation fails.
 */
export class RedisError extends ExternalServiceError {
	constructor(message: string) {
		super('Redis', message);
	}
}

/**
 * Error thrown when database operation fails.
 */
export class DatabaseError extends AppError {
	constructor(message: string) {
		super(message, 500);
	}
}

/**
 * Error thrown when email sending fails.
 */
export class EmailError extends ExternalServiceError {
	constructor(message: string) {
		super('Email', message);
	}
}

/**
 * Type guard to check if an error is an AppError.
 */
export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

/**
 * Type guard to check if an error is a standard Error.
 */
export function isError(error: unknown): error is Error {
	return error instanceof Error;
}

/**
 * Extract error message from any error type.
 */
export function getErrorMessage(error: unknown): string {
	if (isError(error)) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	return 'An unexpected error occurred';
}

/**
 * Extract status code from error, defaulting to 500.
 */
export function getErrorStatusCode(error: unknown): number {
	if (isAppError(error)) {
		return error.statusCode;
	}
	return 500;
}
