import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

interface EncryptedData {
	ciphertext: string;
	iv: string;
	authTag: string;
}

function getEncryptionKey(): Buffer {
	const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;
	if (!keyHex) {
		throw new Error(
			'CREDENTIAL_ENCRYPTION_KEY environment variable is not set'
		);
	}
	if (keyHex.length !== 64) {
		throw new Error(
			'CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'
		);
	}
	return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypts a string using AES-256-GCM
 * @param plaintext The string to encrypt
 * @returns JSON string containing ciphertext, iv, and authTag
 */
export function encrypt(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = crypto.randomBytes(IV_LENGTH);

	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
	let encrypted = cipher.update(plaintext, 'utf8', 'base64');
	encrypted += cipher.final('base64');

	const authTag = cipher.getAuthTag();

	const encryptedData: EncryptedData = {
		ciphertext: encrypted,
		iv: iv.toString('base64'),
		authTag: authTag.toString('base64'),
	};

	return JSON.stringify(encryptedData);
}

/**
 * Decrypts a string encrypted with encrypt()
 * @param encryptedJson JSON string from encrypt()
 * @returns The original plaintext
 */
export function decrypt(encryptedJson: string): string {
	const key = getEncryptionKey();

	let encryptedData: EncryptedData;
	try {
		encryptedData = JSON.parse(encryptedJson);
	} catch {
		throw new Error('Invalid encrypted data format');
	}

	const { ciphertext, iv, authTag } = encryptedData;
	if (!ciphertext || !iv || !authTag) {
		throw new Error('Missing required encryption fields');
	}

	const decipher = crypto.createDecipheriv(
		ALGORITHM,
		key,
		Buffer.from(iv, 'base64')
	);
	decipher.setAuthTag(Buffer.from(authTag, 'base64'));

	let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}

/**
 * Encrypts a Gmail refresh token
 */
export function encryptRefreshToken(refreshToken: string): string {
	return encrypt(refreshToken);
}

/**
 * Decrypts a Gmail refresh token
 */
export function decryptRefreshToken(encryptedToken: string): string {
	return decrypt(encryptedToken);
}
