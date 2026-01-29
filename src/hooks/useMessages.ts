// API imports
import { messageAPI } from '@/services/api';

// Types imports
import { MessagesResponse } from '@/types/messageTypes';

// Tanstack React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useAllMessagesByContactId = (contactId: number) => {
	return useQuery<MessagesResponse>({
		queryKey: ['all-messages-by-contact-id', contactId],
		queryFn: () => messageAPI.readAllByContactId(contactId),
		refetchOnWindowFocus: true,
		refetchInterval: 1000 * 30, // Refetch every 30 seconds
	});
};

export const useMessagesGetAllPending = () => {
	return useQuery<MessagesResponse>({
		queryKey: ['pending-messages-get-all'],
		queryFn: () => messageAPI.getAllPending(),
		refetchOnWindowFocus: true,
		refetchInterval: 1000 * 30, // Refetch every 30 seconds
	});
};

export const useMessageApprove = () => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, number>({
		mutationFn: (messageId: number) => messageAPI.approveMessage(messageId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				predicate: (query) =>
					[
						'pending-messages-get-all',
						'all-messages-by-contact-id',
						'messages-get-by-contact',
						'sequences-get-by-contact',
					].includes(query.queryKey[0] as string),
			});
		},
	});
};

export const useMessageUpdate = () => {
	const queryClient = useQueryClient();

	return useMutation<
		void,
		Error,
		{ messageId: number; contents: string; subject: string }
	>({
		mutationFn: ({ messageId, contents, subject }) =>
			messageAPI.updateMessage(messageId, contents, subject),
		onSuccess: () => {
			queryClient.invalidateQueries({
				predicate: (query) =>
					['pending-messages-get-all', 'all-messages-by-contact-id'].includes(
						query.queryKey[0] as string
					),
			});
		},
	});
};
