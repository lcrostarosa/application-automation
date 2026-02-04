import { repliesAPI } from '@/services/api';

// Tanstack React Query
import { useQuery, useMutation } from '@tanstack/react-query';

interface Reply {
	id: number;
	replySubject: string;
	replyContent: string;
	date: string;
	contact: {
		email: string;
		firstName?: string;
		lastName?: string;
	};
}

export const useGetAllReplies = () => {
	return useQuery<Reply[]>({
		queryKey: ['replies-get-all'],
		queryFn: repliesAPI.getAll,
	});
};

export const useCheckNewReplies = () => {
	return useMutation({
		mutationFn: repliesAPI.checkForNew,
		onSuccess: () => {
			alert('Checked for replies successfully!');
		},
		onError: (error: Error) => {
			console.error('Error checking for replies:', error);
			alert(`Error checking for replies: ${error.message}`);
		},
	});
};
