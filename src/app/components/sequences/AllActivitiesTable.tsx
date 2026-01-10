// Library imports
import { useState, Fragment } from 'react';

// Styles imports
import styles from './tableStyles.module.scss';

// Icon imports
import { SwapVert } from '@mui/icons-material';

// Types imports
import { SequenceFromDB } from '@/types/sequenceTypes';
import { MessageFromDB } from '@/types/messageTypes';

// Components
import MessagesTable from './MessagesTable';
import SequencesTable from './SequencesTable';

interface PreviousActivity {
	type: 'message' | 'sequence';
	sortDate: Date;
	details: MessageFromDB | SequenceFromDB;
}

const AllActivitiesTable = ({
	sequences,
	previousActivities,
}: {
	sequences: SequenceFromDB[];
	previousActivities: PreviousActivity[];
}) => {
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [selectedActivity, setSelectedActivity] = useState<number | null>(null);

	const handleSort = () => {
		setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
	};

	console.log('Previous Activities:', previousActivities);

	const sortedActivities = [...previousActivities].sort((a, b) => {
		const dateA = a.sortDate.getTime();
		const dateB = b.sortDate.getTime();
		return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
	});

	const handleClick = (index: number) => {
		if (selectedActivity === index) {
			setSelectedActivity(null);
		} else {
			setSelectedActivity(index);
		}
	};

	return (
		<table className={styles.table}>
			<thead className={styles.tableHeader}>
				<tr>
					<th className={styles.sm}>
						<span className={styles.sort}>Type</span>
					</th>
					<th className={styles.lrg}>Name</th>
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
				{sortedActivities.map((activity, index) => {
					const sequenceCompletionDate = new Date(
						activity.sortDate!
					).toLocaleDateString();

					return (
						<Fragment key={index}>
							<tr
								className={selectedActivity === index ? styles.selected : ''}
								onClick={() => {
									handleClick(index);
								}}
							>
								<td className={styles.sm}>
									{activity.type === 'sequence'
										? 'Sequence Email'
										: 'Stand-alone Email'}
								</td>
								<td
									className={`${styles.md} ${styles.left}`}
									style={{ fontWeight: '600' }}
								>
									{activity.type === 'sequence'
										? (activity.details as SequenceFromDB).title
										: (activity.details as MessageFromDB).subject}
								</td>

								<td className={`${styles.sm} ${styles.right}`}>
									{sequenceCompletionDate}
								</td>
								<td className={`${styles.sm} ${styles.right}`}>
									{activity.type === 'sequence'
										? (activity.details as SequenceFromDB).emailReplies.length >
										  0
											? 'Yes'
											: 'No'
										: activity.type === 'message' &&
										  (activity.details as MessageFromDB).hasReply
										? 'Yes'
										: 'No'}
								</td>
							</tr>
							{selectedActivity === index && activity.type === 'sequence' ? (
								<tr className={styles['expanded-row']}>
									<td colSpan={6}>
										<SequencesTable
											sequence={activity.details as SequenceFromDB}
											nested={true}
										/>
									</td>
								</tr>
							) : selectedActivity === index && activity.type === 'message' ? (
								<tr className={styles['expanded-row']}>
									<td colSpan={6}>
										<MessagesTable
											messages={[activity.details as MessageFromDB]}
											nested={true}
										/>
									</td>
								</tr>
							) : null}
						</Fragment>
					);
				})}
			</tbody>
		</table>
	);
};

export default AllActivitiesTable;
