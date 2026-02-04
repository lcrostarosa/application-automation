'use client';

// Library imports
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Styles
import styles from './sequencesClient.module.scss';

// Hooks imports
import { useAllSequencesByUserId } from '@/hooks/useSequence';

// Types imports
import { SequenceFromDB } from '@/types/sequenceTypes';

// Components imports
import ActiveSequence from '@/app/components/sequences/active/ActiveSequence';
import PreviousSequencesTable from '@/app/components/sequences/PreviousSequencesTable';

const SequencesClient = ({
	initialSequences,
}: {
	initialSequences: SequenceFromDB[];
}) => {
	const queryClient = useQueryClient();

	type SelectedType = 'active' | 'previous';
	const [selected, setSelected] = useState<SelectedType>('active');

	useEffect(() => {
		if (initialSequences && initialSequences.length > 0) {
			queryClient.setQueryData<SequenceFromDB[]>(
				['sequences-get-all'],
				initialSequences
			);
		}
	}, [initialSequences, queryClient]);

	const { data: sequencesData } = useAllSequencesByUserId();

	const sequences = sequencesData?.sequences || [];

	const activeSequences = sequences.filter((seq) => seq.active);
	const previousSequences = sequences.filter((seq) => !seq.active);

	return (
		<div className={styles.client}>
			<div className={styles.content}>
				<div className={styles.nav}>
					<h2
						className={selected === 'active' ? styles.selected : ''}
						onClick={() => setSelected('active')}
					>
						Active Sequences
					</h2>

					<h2
						className={selected === 'previous' ? styles.selected : ''}
						onClick={() => setSelected('previous')}
					>
						Previous Sequences
					</h2>
				</div>

				{selected === 'active' && (
					<>
						{activeSequences.length > 0 ? (
							activeSequences.map((sequence) => (
								<ActiveSequence key={sequence.id} sequence={sequence} />
							))
						) : (
							<div className={styles.activity}>
								<p>No active sequences</p>
							</div>
						)}
					</>
				)}

				{selected === 'previous' && (
					<>
						{previousSequences.length > 0 ? (
							<PreviousSequencesTable sequences={previousSequences} />
						) : (
							<div className={styles.activity}>
								<p>No previous sequences</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default SequencesClient;
