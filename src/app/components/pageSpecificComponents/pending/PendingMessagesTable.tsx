'use client';

// Library imports
import { useState } from 'react';

// Styles imports
import styles from './pendingMessagesTable.module.scss';

// MUI imports
import { SwapVert } from '@mui/icons-material';

// Helper functions imports
import { parseEmailContent } from '@/lib/helperFunctions';

// Types imports
import { MessageFromDB } from '@/types/messageTypes';

const PendingMessagesTable = ({
	messages,
	nested,
}: {
	messages: MessageFromDB[];
	nested?: boolean;
}) => {
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [selectedMessage, setSelectedMessage] = useState<number | null>(null);

	const handleSort = () => {
		setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
	};

	const handleClick = (messageId: number) => {
		const selection =
			typeof window !== 'undefined' ? window.getSelection?.()?.toString() : '';
		if (selection && selection.length > 0) return;

		if (selectedMessage === messageId) {
			setSelectedMessage(null);
		} else {
			setSelectedMessage(messageId);
		}
	};

	const sortedMessages = [...messages].sort((a, b) => {
		const dateA = new Date(a.createdAt).getTime();
		const dateB = new Date(b.createdAt).getTime();
		return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
	});

	return (
		<table className={styles.table}>
			<thead className={styles.tableHeader}>
				<tr className={nested ? styles.nested : ''}>
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
					console.log('message from map', message);
					const messageDateDay = message.sentAt
						? new Date(message.sentAt)
						: new Date(message.scheduledAt!);
					const parsedContent = parseEmailContent(message.contents);
					const messageStatus =
						message.status === 'pending'
							? 'Pending Approval'
							: message.status[0].toUpperCase() + message.status.slice(1);

					return (
						<tr
							key={message.id}
							onClick={() => handleClick(message.id)}
							className={`${nested ? styles.nested : ''} ${
								selectedMessage === message.id ? styles.selectedMessage : ''
							}`}
						>
							<td
								className={`${styles.md} ${
									message.status === 'scheduled' || message.status === 'pending'
										? styles.scheduled
										: message.status === 'cancelled'
										? styles.cancelled
										: ''
								}`}
							>
								{message.subject}
							</td>
							<td
								className={`${styles.lrg} ${styles['content-cell']} ${
									message.status === 'scheduled' || message.status === 'pending'
										? styles.scheduled
										: message.status === 'cancelled'
										? styles.cancelled
										: ''
								}`}
							>
								<div className={styles['parsed-content']}>
									<span className={styles['message-preview']}>
										{parsedContent[0]}
									</span>
									{selectedMessage === message.id &&
										parsedContent.length > 1 &&
										parsedContent
											.slice(1)
											.map((text, index) => <span key={index}>{text}</span>)}
								</div>
							</td>
							<td
								className={`${styles.sm} ${
									message.status === 'pending'
										? styles.pending
										: message.status === 'cancelled'
										? styles.cancelled
										: ''
								}`}
							>
								{messageStatus}
							</td>
							<td
								className={`${styles.sm} ${styles.right} ${
									message.status === 'scheduled' || message.status === 'pending'
										? styles.scheduled
										: message.status === 'cancelled'
										? styles.cancelled
										: ''
								}`}
							>
								{message.status === 'sent'
									? messageDateDay.toLocaleDateString()
									: message.status !== 'cancelled'
									? `Scheduled for ${messageDateDay.toLocaleDateString()}`
									: ' N/A'}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default PendingMessagesTable;
