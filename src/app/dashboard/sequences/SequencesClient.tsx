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
import DeactivateAllSequencesButton from '@/app/components/buttons/DeactivateAllSequencesButton';
import PreviousSequences from '@/app/components/sequences/PreviousSequences';
import ActiveSequences from '@/app/components/sequences/ActiveSequences';

const SequencesClient = ({
	initialSequences,
}: {
	initialSequences: SequenceFromDB[];
}) => {
	const queryClient = useQueryClient();

	type SelectedType = 'active' | 'previous';
	const [selected, setSelected] = useState<SelectedType>('active');

	interface SequenceContent {
		[key: string]: {
			component: React.ReactNode;
		};
	}

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

	const sequenceContent: SequenceContent = {
		active: {
			component:
				activeSequences.length > 0 ? (
					<ActiveSequences sequences={activeSequences} />
				) : (
					<div className={styles.activity}>
						<p>No active sequences</p>
					</div>
				),
		},
		previous: {
			component:
				previousSequences.length > 0 ? (
					<PreviousSequences sequences={previousSequences} contact={true} />
				) : (
					<div className={styles.activity}>
						<p>No previous sequences</p>
					</div>
				),
		},
	};

	return (
		<div className={styles.client}>
			<DeactivateAllSequencesButton />

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
				{sequenceContent[selected].component}
			</div>
		</div>
	);
};

export default SequencesClient;
