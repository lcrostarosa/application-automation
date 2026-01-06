// API imports
import { sequenceAPI } from '@/services/api';

// Types imports
import { SequencesResponse } from '@/types/sequenceTypes';

// Tanstack React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useSequencesByContactId = (contactId: number) => {
	return useQuery<SequencesResponse>({
		queryKey: ['sequences-by-contact-id', contactId],
		queryFn: () => sequenceAPI.readAllByContactId(contactId),
	});
};
