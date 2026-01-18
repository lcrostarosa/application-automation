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
	});
};

export const useStandaloneMessagesByContactId = (contactId: number) => {
	return useQuery<MessagesResponse>({
		queryKey: ['standalone-messages-by-contact-id', contactId],
		queryFn: () => messageAPI.readStandaloneByContactId(contactId),
	});
};

export const useMessagesGetAllPending = () => {
	return useQuery<MessagesResponse>({
		queryKey: ['pending-messages-get-all'],
		queryFn: () => messageAPI.getAllPending(),
	});
};

export const useMessageApprove = () => {
	const queryClient = useQueryClient();

	return useMutation<void, Error, number>({
		mutationFn: (messageId: number) => messageAPI.approveMessage(messageId),
		onSuccess: () => {
			// Invalidate pending messages to update the count/list
			queryClient.invalidateQueries({ queryKey: ['pending-messages-get-all'] });
			// Also invalidate messages by contact in case viewing contact details
			queryClient.invalidateQueries({
				queryKey: ['all-messages-by-contact-id'],
			});
			queryClient.invalidateQueries({
				queryKey: ['standalone-messages-by-contact-id'],
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
			// Invalidate queries to update the data
			queryClient.invalidateQueries({ queryKey: ['pending-messages-get-all'] });
			queryClient.invalidateQueries({
				queryKey: ['all-messages-by-contact-id'],
			});
			queryClient.invalidateQueries({
				queryKey: ['standalone-messages-by-contact-id'],
			});
		},
	});
};
