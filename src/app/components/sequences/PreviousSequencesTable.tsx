// Library imports
import { useState, Fragment } from 'react';

// Styles imports
import styles from './tableStyles.module.scss';

// Helpers imports
import { sequenceType } from '@/lib/helperFunctions';

// Icon imports
import { SwapVert } from '@mui/icons-material';

// Types imports
import { SequenceFromDB } from '@/types/sequenceTypes';

// Components
import MessagesTable from './MessagesTable';

const PreviousSequencesTable = ({
	sequences,
}: // previousActivities,
{
	sequences: SequenceFromDB[];
	// previousActivities: PreviousActivity[];
}) => {
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [selectedSequence, setSelectedSequence] = useState<number | null>(null);

	const handleSort = () => {
		setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
	};

	const handleClick = (sequenceId: number) => {
		if (selectedSequence === sequenceId) {
			setSelectedSequence(null);
		} else {
			setSelectedSequence(sequenceId);
		}
	};

	const sortedSequences = [...sequences].sort((a, b) => {
		const dateA = new Date(a.endDate!).getTime();
		const dateB = new Date(b.endDate!).getTime();
		return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
	});

	return (
		<table className={styles['table']}>
			<thead className={styles.tableHeader}>
				<tr>
					<th className={styles.lrg}>
						<span className={styles.sort}>Name</span>
					</th>
					<th className={styles.md}>
						<span className={styles.sort}>Sequence Type</span>
					</th>
					<th className={styles.sm}>Duration (Days)</th>
					<th className={styles.sm}>Messages Sent</th>
					<th className={styles.sm} onClick={() => handleSort()}>
						<span className={styles.sort}>
							Completion Date
							<SwapVert fontSize='small' />
						</span>
					</th>
					<th className={styles.sm}>Replied</th>
				</tr>
			</thead>
			<tbody>
				{sortedSequences.map((sequence) => {
					const sequenceCompletionDate = new Date(sequence.endDate!);
					const sequenceStartDate = new Date(sequence.createdAt);
					const sequenceDuration = Math.ceil(
						(sequenceCompletionDate.getTime() - sequenceStartDate.getTime()) /
							(1000 * 60 * 60 * 24)
					);

					return (
						<Fragment key={sequence.id}>
							<tr
								onClick={() => handleClick(sequence.id)}
								className={
									selectedSequence === sequence.id ? styles.selected : ''
								}
							>
								<td className={styles.lrg} style={{ fontWeight: '600' }}>
									{sequence.title}
								</td>
								<td className={`${styles.md} ${styles.right}`}>
									{sequenceType(
										sequence.sequenceType,
										new Date(sequence.createdAt)
									)}
								</td>
								<td className={`${styles.sm} ${styles.right}`}>
									{sequenceDuration}
								</td>
								<td className={`${styles.sm} ${styles.right}`}>
									{
										sequence.messages.filter(
											(message) => message.status === 'sent'
										).length
									}
								</td>
								<td className={`${styles.sm} ${styles.right}`}>
									{sequenceCompletionDate.toLocaleDateString()}
								</td>
								<td className={`${styles.sm} ${styles.right}`}>
									{sequence.emailReplies.length > 0 ? 'Yes' : 'No'}
								</td>
							</tr>
							{selectedSequence === sequence.id && (
								<tr className={styles['expanded-row']}>
									<td colSpan={6}>
										<MessagesTable messages={sequence.messages} nested={true} />
									</td>
								</tr>
							)}
						</Fragment>
					);
				})}
			</tbody>
		</table>
	);
};

export default PreviousSequencesTable;
