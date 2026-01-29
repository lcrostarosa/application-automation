'use client';

// Library imports
import { useState } from 'react';

// Hooks imports
import { useMessageUpdate } from '@/hooks/useMessages';
import { useMessageApprove } from '@/hooks/useMessages';

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
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
	const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
	const [editorContent, setEditorContent] = useState<string>('');
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [subjectContent, setSubjectContent] = useState<string>('');
	const { mutateAsync: updateMessage } = useMessageUpdate();
	const { mutateAsync: approveMessage } = useMessageApprove();

	const handleSort = () => {
		setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
	};

	const handleClick = (messageId: number) => {
		if (isEditing) {
			if (selectedMessage === messageId) return;

			setIsEditing(false);
			setSelectedMessage(messageId);
			return;
		}

		const selection =
			typeof window !== 'undefined' ? window.getSelection?.()?.toString() : '';
		if (selection && selection.length > 0) return;

		if (selectedMessage === messageId) {
			setSelectedMessage(null);
		} else {
			setSelectedMessage(messageId);
		}
	};

	const handleEdit = (
		e: React.MouseEvent<HTMLButtonElement>,
		messageId: number
	) => {
		e.stopPropagation();
		if (messageId !== selectedMessage) {
			setSelectedMessage(messageId);
		}
		if (!selectedMessage) {
			setSelectedMessage(messageId);
		}
		setIsEditing(true);
	};

	const handleApprove = (messageId: number) => {
		if (isEditing) return;
		approveMessage(messageId);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setSelectedMessage(null);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSubjectContent(e.target.value);
	};

	const handleSaveAndApprove = () => {
		if (selectedMessage && isEditing) {
			updateMessage({
				messageId: selectedMessage,
				contents: editorContent
					? editorContent.trim()
					: messages.find((m) => m.id === selectedMessage)?.contents || '',
				subject: subjectContent
					? subjectContent.trim()
					: messages.find((m) => m.id === selectedMessage)?.subject || '',
			});
			approveMessage(selectedMessage);
		}
		setIsEditing(false);
		setSelectedMessage(null);
	};

	const sortedMessages = [...messages].sort((a, b) => {
		const dateA = new Date(a.createdAt).getTime();
		const dateB = new Date(b.createdAt).getTime();
		return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
	});

	if (!messages.length) {
		return (
			<div className={styles.activity}>
				<p>No pending emails</p>
			</div>
		);
	}

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
					const messageDateDay =
						message.scheduledAt && new Date(message.scheduledAt);
					const passedScheduledAt = messageDateDay
						? new Date() >= messageDateDay
						: false;
					const parsedContent = parseEmailContent(message.contents);
					const messageStatus =
						message.status === 'pending' ||
						(message.status === 'scheduled' &&
							message.needsApproval &&
							!message.approved)
							? 'Pending Approval'
							: 'Scheduled';
					const messageNeedsApproval = message.needsApproval;

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
								{isEditing && selectedMessage === message.id ? (
									<div className={styles['rte-wrapper']}>
										{/* Subject Field */}
										<div className={styles['input-group']}>
											<div className={styles.input}>
												<label htmlFor='subject'>Subject:</label>
												<input
													type='text'
													id='subject'
													defaultValue={message.subject}
													onChange={(e) => handleChange(e)}
												/>
											</div>
										</div>

										{/* RTE */}
										<TinyEditor
											height={300}
											initialValue={message.contents}
											setEditorContent={setEditorContent}
										/>
										<div className={styles.buttons}>
											<button
												className={styles.button}
												onClick={handleSaveAndApprove}
											>
												{messageNeedsApproval
													? 'Save and Approve'
													: 'Save Changes'}
											</button>
											<button className={styles.button} onClick={handleCancel}>
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
									message.status === 'pending' ||
									(message.status === 'scheduled' &&
										message.needsApproval &&
										!message.approved)
										? styles.important
										: message.status === 'scheduled'
										? styles.approved
										: ''
								}`}
							>
								{messageStatus}
							</td>
							<td
								className={`${styles.sm} ${styles.right} ${
									passedScheduledAt ? styles.important : ''
								}`}
							>
								{messageDateDay!.toLocaleDateString()}
							</td>
							<td
								colSpan={2}
								className={styles.buttonBox}
								style={{
									verticalAlign:
										isEditing || selectedMessage === message.id
											? 'top'
											: 'middle',
									paddingTop:
										isEditing || selectedMessage === message.id
											? '.25rem'
											: '0',
								}}
							>
								<div className={styles.buttons}>
									<button
										className={`${styles.action} ${
											isEditing ? styles.disabled : ''
										}`}
										onClick={(e) => handleEdit(e, message.id)}
										disabled={isEditing}
									>
										<Edit className={styles.icon} />
										Edit
									</button>
									<button
										className={`${styles.action} ${
											isEditing || !messageNeedsApproval ? styles.disabled : ''
										}`}
										disabled={isEditing || !messageNeedsApproval}
										onClick={() => handleApprove(message.id)}
									>
										Approve
									</button>
								</div>
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default PendingMessagesTable;
