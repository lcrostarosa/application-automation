'use client';

// Libraries imports
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Hooks imports
import { useMessagesGetAllPending } from '@/hooks/useMessages';

// Types imports
import { MessageFromDB, MessagesResponse } from '@/types/messageTypes';

// Components imports
import PendingMessagesTable from '@/app/components/pageSpecificComponents/pending/PendingMessagesTable';

export default function PendingMessagesClient({
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

	return <PendingMessagesTable messages={messages} />;
}
