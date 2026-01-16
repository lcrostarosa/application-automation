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
	const messages = data?.messages || [];
	const hasNotifications = messages.length > 0;

	return <SideBar notifications={hasNotifications} />;
}
