'use client';

// Library imports
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Hooks imports
import { useGetAllReplies, useCheckNewReplies } from '@/hooks/useReplies';

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
	const { mutate: checkNewReplies } = useCheckNewReplies();

	useEffect(() => {
		if (initialReplies && initialReplies.length > 0) {
			queryClient.setQueryData<RepliesFromDB[]>(
				['replies-get-all'],
				initialReplies
			);
		}
	}, [initialReplies, queryClient]);

	const { data: repliesData } = useGetAllReplies();

	const replies = repliesData?.replies || [];

	return (
		<div>
			<button onClick={() => checkNewReplies()}>Check for Replies</button>
			<RepliesTable replies={replies} />
		</div>
	);
};

export default RepliesClient;
