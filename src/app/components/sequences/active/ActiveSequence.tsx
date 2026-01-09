// Helper functions imports
import { sequenceType } from '@/lib/helperFunctions';

// Hooks imports

// Styles imports
import styles from './activeSequence.module.scss';

// Types imports
import { SequenceFromDB } from '@/types/sequenceTypes';

// Components imports
import DeactivateSequenceButton from '@/app/components/buttons/DeactivateSequenceButton';
import MessagesTable from '../MessagesTable';

// Context imports

const ActiveSequence = ({ sequence }: { sequence: SequenceFromDB }) => {
	const startDate = new Date(sequence.createdAt).toLocaleDateString();
	const endDate = sequence.endDate
		? new Date(sequence.endDate).toLocaleDateString()
		: null;
	const nextStepDue = sequence.nextStepDue
		? new Date(sequence.nextStepDue).toLocaleDateString()
		: 'N/A';

	return (
		<div className={styles['active-sequence-table']}>
			<div className={styles['header-details']}>
				<div className={styles['sequence-info']}>
					<div className={styles.title}>
						<span className={styles.label}>Name:</span>
						<span className={styles.value}>{sequence.title}</span>
					</div>
					<div className={styles.title}>
						<span className={styles.label}>Sequence Type:</span>
						<span className={styles.value}>
							{sequenceType(
								sequence.sequenceType,
								new Date(sequence.createdAt)
							)}
						</span>
					</div>
					<div className={styles.title}>
						<span className={styles.label}>Next Step Due:</span>
						<span className={styles.value}>{nextStepDue}</span>
					</div>
				</div>
				<div className={styles['dates-info']}>
					<div className={styles['info-row']}>
						<span className={styles.label}>Start Date:</span>
						<span className={styles.value}>{startDate}</span>
					</div>

					{endDate && (
						<div className={styles['info-row']}>
							<span className={styles.label}>End Date:</span>
							<span className={styles.value}>{endDate}</span>
						</div>
					)}
					<DeactivateSequenceButton sequenceId={sequence.id} />
				</div>
			</div>

			<div className={styles['sequence-details']}>
				<MessagesTable messages={sequence.messages} />
			</div>
		</div>
	);
};

export default ActiveSequence;
