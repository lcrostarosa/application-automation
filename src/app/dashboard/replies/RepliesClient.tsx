'use client';

// Library imports
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Hooks imports
import { useGetAllReplies } from '@/hooks/useReplies';

// Styles imports

// Icon imports

// Components imports
import RepliesTable from '@/app/components/pageSpecificComponents/replies/RepliesTable';

// Context imports

// Types imports
import { RepliesFromDB, RepliesResponse } from '@/types/repliesTypes';

const RepliesClient = ({
	initialReplies,
}: {
	initialReplies: RepliesFromDB[];
}) => {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (initialReplies) {
			queryClient.setQueryData<RepliesResponse>(['replies-get-all'], {
				replies: initialReplies,
			});
		}
	}, [initialReplies, queryClient]);

	return <RepliesTable />;
};

export default RepliesClient;
