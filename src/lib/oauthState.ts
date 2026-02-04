import * as crypto from 'crypto';

const STATE_SECRET = process.env.AUTH0_SECRET || process.env.API_SECRET;
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

interface OAuthState {
	userId: number;
	timestamp: number;
	nonce: string;
}

function getStateSecret(): string {
	if (!STATE_SECRET) {
		throw new Error(
			'AUTH0_SECRET or API_SECRET environment variable is required for OAuth state signing'
		);
	}
	return STATE_SECRET;
}

/**
 * Creates a signed OAuth state parameter containing the user ID
 * @param userId The user's ID to embed in the state
 * @returns Base64-encoded signed state string
 */
export function createOAuthState(userId: number): string {
	const state: OAuthState = {
		userId,
		timestamp: Date.now(),
		nonce: crypto.randomBytes(8).toString('hex'),
	};

	const payload = JSON.stringify(state);
	const signature = crypto
		.createHmac('sha256', getStateSecret())
		.update(payload)
		.digest('hex');

	const signedState = {
		payload: Buffer.from(payload).toString('base64'),
		signature,
	};

	return Buffer.from(JSON.stringify(signedState)).toString('base64url');
}

/**
 * Verifies and extracts the user ID from a signed OAuth state parameter
 * @param stateParam The state parameter from the OAuth callback
 * @returns The user ID if valid
 * @throws Error if state is invalid, expired, or tampered with
 */
export function verifyOAuthState(stateParam: string): number {
	let signedState: { payload: string; signature: string };
	try {
		signedState = JSON.parse(
			Buffer.from(stateParam, 'base64url').toString('utf8')
		);
	} catch {
		throw new Error('Invalid state format');
	}

	if (!signedState.payload || !signedState.signature) {
		throw new Error('Missing state components');
	}

	const payload = Buffer.from(signedState.payload, 'base64').toString('utf8');

	// Verify signature
	const expectedSignature = crypto
		.createHmac('sha256', getStateSecret())
		.update(payload)
		.digest('hex');

	if (
		!crypto.timingSafeEqual(
			Buffer.from(signedState.signature, 'hex'),
			Buffer.from(expectedSignature, 'hex')
		)
	) {
		throw new Error('Invalid state signature');
	}

	let state: OAuthState;
	try {
		state = JSON.parse(payload);
	} catch {
		throw new Error('Invalid state payload');
	}

	// Check expiry
	if (Date.now() - state.timestamp > STATE_EXPIRY_MS) {
		throw new Error('State has expired');
	}

	if (typeof state.userId !== 'number' || state.userId <= 0) {
		throw new Error('Invalid user ID in state');
	}

	return state.userId;
}
