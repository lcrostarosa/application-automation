import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser } from '@/services/getUserService';

export async function GET(req: NextRequest) {
	try {
		const { user, error } = await getApiUser();
		if (error) {
			return NextResponse.json(
				{ error: error.error },
				{ status: error.status }
			);
		}

		const replies = await prisma.emailReply.findMany({
			where: {
				ownerId: user.id,
			},
			include: {
				contact: true, // Include contact details
			},
			orderBy: {
				replyDate: 'desc',
			},
		});

		return NextResponse.json({ replies });
	} catch (error: any) {
		console.error('Error fetching replies:', error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
