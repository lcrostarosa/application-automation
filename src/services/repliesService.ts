import { prisma } from '@/lib/prisma';

// Services imports
import { getApiUser } from './getUserService';

export async function getAllRepliesByUserId() {
	const { user, error } = await getApiUser();

	if (error || !user) {
		console.error('Error fetching user or user not found:', error);
		return { replies: [] };
	}

	const replies = await prisma.emailReply.findMany({
		where: { ownerId: user.id },
		orderBy: { createdAt: 'desc' },
	});

	return { replies };
}
