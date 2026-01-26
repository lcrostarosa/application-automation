'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SideBar from './SideBar';
import { useMessagesGetAllPending } from '@/hooks/useMessages';
import { MessageFromDB, MessagesResponse } from '@/types/messageTypes';

export default function SideBarClient({
	initialMessages = [],
}: {
	initialMessages: MessageFromDB[];
}) {
	const queryClient = useQueryClient();

	// hydrate server data into the cache
	useEffect(() => {
		if (initialMessages) {
			queryClient.setQueryData<MessagesResponse>(['pending-messages-get-all'], {
				messages: initialMessages,
			});
		}
	}, [initialMessages, queryClient]);

	const { data } = useMessagesGetAllPending();

	useEffect(() => {
		if (data?.messages) {
			queryClient.setQueryData<MessagesResponse>(
				['pending-messages-get-all'],
				data
			);
		} else if (initialMessages?.length) {
			queryClient.setQueryData<MessagesResponse>(['pending-messages-get-all'], {
				messages: initialMessages,
			});
		}
	}, [data, initialMessages, queryClient]);

	const messages = data?.messages || [];
	const pendingMessages = messages.filter(
		(message) => message.status === 'pending' || !message.approved
	);
	const hasNotifications = pendingMessages.length > 0;

	return <SideBar notifications={hasNotifications} />;
}
