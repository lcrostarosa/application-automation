import { prisma } from '@/lib/prisma';

interface Auth0User {
	sub: string;
	email: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	first_name?: string;
	last_name?: string;
	login?: string;
	nickname?: string;
	timezone?: string;
}

export async function findOrCreateUser(user: Auth0User) {
	// Extract first and last names with fallbacks for different providers
	let firstName: string | null = null;
	let lastName: string | null = null;

	// Try to get names from provider-specific fields first
	if (user.given_name || user.first_name) {
		firstName = user.given_name || user.first_name;
	}

	if (user.family_name || user.last_name) {
		lastName = user.family_name || user.last_name;
	}

	// If we don't have separate names, try to split the full name
	if (!firstName && !lastName && user.name) {
		const nameParts = user.name.trim().split(' ');
		if (nameParts.length >= 2) {
			firstName = nameParts[0];
			lastName = nameParts.slice(1).join(' '); // Handle middle names
		} else if (nameParts.length === 1) {
			firstName = nameParts[0];
		}
	}

	// Fallback to login or nickname for firstName if nothing else available
	if (!firstName && !lastName) {
		firstName = user.login || user.nickname || null;
	}

	const userData = {
		auth0Id: user.sub,
		email: user.email,
		firstName,
		lastName,
		timezone: user.timezone || null,
	};

	return prisma.user.upsert({
		where: { auth0Id: user.sub },
		update: userData,
		create: userData,
	});
}
