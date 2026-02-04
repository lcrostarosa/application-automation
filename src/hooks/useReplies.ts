import { repliesAPI } from '@/services/api';

// Tanstack React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types imports
import { RepliesResponse } from '@/types/repliesTypes';

export const useGetAllReplies = () => {
	return useQuery<RepliesResponse>({
		queryKey: ['replies-get-all'],
		queryFn: () => repliesAPI.getAll(),
	});
};

export const useCheckNewReplies = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => repliesAPI.checkForNew(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				predicate: (query) =>
					['replies-get-all', 'all-messages-by-contact-id'].includes(
						query.queryKey[0] as string
					),
			});
		},
		onError: (error: Error) => {
			console.error('Error checking for replies:', error);
		},
	});
};

export const useReplyUpdate = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (replyId: number) => repliesAPI.markAsReviewed(replyId),
		onSuccess: () => {
			// queryClient.invalidateQueries({
			// 	predicate: (query) =>
			// 		['replies-get-all', 'all-messages-by-contact-id'].includes(
			// 			query.queryKey[0] as string
			// 		),
			// });
		},
		onError: (error: Error) => {
			console.error('Error marking reply as reviewed:', error);
		},
	});
};
