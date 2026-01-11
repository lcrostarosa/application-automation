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
