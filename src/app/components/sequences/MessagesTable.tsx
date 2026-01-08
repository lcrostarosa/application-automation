'use client';

// Library imports
import { useState } from 'react';

// Styles imports
import styles from './messagesTable.module.scss';

// MUI imports
import { SwapVert } from '@mui/icons-material';

// Context imports

// Types imports
import { MessageFromDB } from '@/types/messageTypes';

const MessagesTable = ({
	messages,
	nested,
}: {
	messages: MessageFromDB[];
	nested?: boolean;
}) => {
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

	const handleSort = () => {
		setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
	};

	const sortedMessages = [...messages].sort((a, b) => {
		const dateA = new Date(a.date).getTime();
		const dateB = new Date(b.date).getTime();
		return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
	});

	const today = new Date(Date.now());

	return (
		<table className={styles['messages-table']}>
			<thead>
				<tr className={nested ? styles['nested-row'] : ''}>
					<th className={styles.md}>
						<span className={styles.sort}>Email</span>
					</th>
					<th className={styles.lrg}>
						<span className={styles.sort}>Content</span>
					</th>
					<th className={styles.sm}>Status</th>
					<th className={styles.sm} onClick={() => handleSort()}>
						<span className={styles.sort}>
							Send Date
							<SwapVert fontSize='small' />
						</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{sortedMessages.map((message) => {
					const messageDateDay = new Date(message.date);
					const status = messageDateDay > today;

					return (
						<tr key={message.id} className={nested ? styles['nested-row'] : ''}>
							<td className={styles.md}>{message.subject}</td>
							<td className={styles.lrg}>{message.contents}</td>
							<td className={styles.sm}>{status ? 'Upcoming' : 'Sent'}</td>
							<td className={styles.sm}>
								{messageDateDay.toLocaleDateString()}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default MessagesTable;
