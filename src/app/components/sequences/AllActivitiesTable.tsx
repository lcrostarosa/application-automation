// Library imports
import { useState, Fragment } from 'react';

// Styles imports
import styles from './tableStyles.module.scss';

// Icon imports
import { SwapVert } from '@mui/icons-material';

// Types imports
import { MessagesWithActiveSequence } from '@/types/messageTypes';

// Components
import MessagesTable from './MessagesTable';

const AllActivitiesTable = ({
	messages,
}: {
	messages: MessagesWithActiveSequence[];
}) => {
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [selectedActivity, setSelectedActivity] = useState<number | null>(null);

	const handleSort = () => {
		setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
	};

	const sortedMessages = messages.sort((a, b) => {
		const dateA = new Date(a.createdAt);
		const dateB = new Date(b.createdAt);
		return sortOrder === 'asc'
			? dateA.getTime() - dateB.getTime()
			: dateB.getTime() - dateA.getTime();
	});

	const handleClick = (index: number) => {
		if (selectedActivity === index) {
			setSelectedActivity(null);
		} else {
			setSelectedActivity(index);
		}
	};

	const getSendDate = (message: MessagesWithActiveSequence): string => {
		if (message.status === 'sent' && message.sentAt) {
			return new Date(message.sentAt).toLocaleDateString();
		}
		if (
			(message.status === 'pending' || message.status === 'scheduled') &&
			message.scheduledAt
		) {
			return `Scheduled for ${new Date(
				message.scheduledAt
			).toLocaleDateString()}`;
		}

		return 'N/A';
	};

	return (
		<table className={styles.table}>
			<thead className={styles.tableHeader}>
				<tr>
					<th className={styles.sm}>
						<span className={styles.sort}>Type</span>
					</th>
					<th className={styles.sm}>Status</th>
					<th className={styles.lrg}>Name</th>
					<th className={styles.sm} onClick={() => handleSort()}>
						<span className={styles.sort}>
							Send Date
							<SwapVert fontSize='small' />
						</span>
					</th>
					<th className={styles.sm}>Replied</th>
				</tr>
			</thead>
			<tbody>
				{sortedMessages.map((message, index) => {
					const sendDate = getSendDate(message);

					return (
						<Fragment key={index}>
							<tr
								className={`${
									selectedActivity === index ? styles.selected : ''
								} ${styles[message.status]} ${styles.all}`}
								onClick={() => {
									handleClick(index);
								}}
							>
								<td className={`${styles.sm} ${styles.type}`}>
									{message.sequenceId ? 'Sequence Email' : 'Stand-alone Email'}
								</td>

								<td className={`${styles.sm} ${styles.status}`}>
									{message.sequenceId ? (
										<span className={`${styles[message.status]}`}>
											{message.status === 'pending'
												? 'Pending Approval'
												: message.status[0].toUpperCase() +
												  message.status.slice(1)}
										</span>
									) : (
										<span className={styles.na}>N/A</span>
									)}
								</td>

								<td className={`${styles.md} ${styles.left} ${styles.subject}`}>
									{message.sequenceId ? message.subject : message.subject}
								</td>

								<td className={`${styles.sm} ${styles.right} ${styles.date}`}>
									{sendDate}
								</td>

								<td
									className={`${styles.sm} ${styles.right} ${styles.replied}`}
								>
									{message.status === 'sent'
										? message.hasReply
											? 'Yes'
											: 'No'
										: 'N/A'}
								</td>
							</tr>
							{selectedActivity === index ? (
								<tr className={styles['expanded-row']}>
									<td colSpan={6}>
										<MessagesTable
											messages={[message]}
											tab={'all'}
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
