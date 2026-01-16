'use client';

// Library imports
import { useState } from 'react';

// Styles imports
import styles from './pendingMessagesTable.module.scss';

// MUI imports
import { Edit, SwapVert } from '@mui/icons-material';

// Helper functions imports
import { parseEmailContent } from '@/lib/helperFunctions';

// Types imports
import { MessageFromDB } from '@/types/messageTypes';

// Components imports
import TinyEditor from '../../editor/TinyEditor';

const PendingMessagesTable = ({
	messages,
	nested,
}: {
	messages: MessageFromDB[];
	nested?: boolean;
}) => {
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
	const [editorContent, setEditorContent] = useState<string>('');
	const [isEditing, setIsEditing] = useState<boolean>(false);

	const handleSort = () => {
		setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
	};

	const handleClick = (messageId: number) => {
		if (isEditing) return;

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
				<tr>
					<th className={styles.md}>Email</th>
					<th className={styles.lrg}>Content</th>
					<th className={styles.sm}>Status</th>
					<th className={styles.sm} onClick={() => handleSort()}>
						<span className={styles.sort}>
							Scheduled Date
							<SwapVert fontSize='small' />
						</span>
					</th>
					<th colSpan={2} className={`${styles.sm} ${styles.center}`}>
						Actions
					</th>
				</tr>
			</thead>
			<tbody>
				{sortedMessages.map((message) => {
					const messageDateDay = message.sentAt
						? new Date(message.sentAt)
						: new Date(message.scheduledAt!);
					const parsedContent = parseEmailContent(message.contents);
					const messageStatus =
						message.status === 'pending' ? 'Pending Approval' : 'Scheduled';

					return (
						<tr
							key={message.id}
							onClick={() => handleClick(message.id)}
							className={`${nested ? styles.nested : ''} ${
								selectedMessage === message.id ? styles.selectedMessage : ''
							} ${isEditing ? styles.editing : ''}`}
						>
							<td className={styles.md}>{message.subject}</td>
							<td className={`${styles.lrg} ${styles['content-cell']}`}>
								{isEditing ? (
									<div className={styles['rte-wrapper']}>
										<TinyEditor
											height={300}
											initialValue={message.contents}
											setEditorContent={setEditorContent}
										/>
										<div className={styles.buttons}>
											<button
												className={styles.button}
												onClick={() => {
													setIsEditing(!isEditing);
												}}
											>
												Save and Approve
											</button>
											<button
												className={styles.button}
												onClick={() => {
													setIsEditing(!isEditing);
													setSelectedMessage(null);
												}}
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
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
								)}
							</td>
							<td
								className={`${styles.sm} ${
									message.status === 'pending' ? styles.important : ''
								}`}
							>
								{messageStatus}
							</td>
							<td className={`${styles.sm} ${styles.right} $`}>
								{messageDateDay.toLocaleDateString()}
							</td>
							<td className={styles.buttonBox}>
								<button
									className={`${styles.action} ${
										isEditing ? styles.disabled : ''
									}`}
									onClick={() => {
										setIsEditing(!isEditing);
									}}
									disabled={isEditing}
								>
									<Edit className={styles.icon} />
									Edit
								</button>
							</td>
							<td className={styles.buttonBox}>
								<button
									className={`${styles.action} ${
										isEditing ? styles.disabled : ''
									}`}
									disabled={isEditing}
								>
									Approve
								</button>
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default PendingMessagesTable;
