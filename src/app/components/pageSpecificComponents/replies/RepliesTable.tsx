// Library imports
import Link from 'next/link';

// Services imports

// Hooks imports
import { useReplyUpdate } from '@/hooks/useReplies';

// Styles imports
import styles from '../../sequences/tableStyles.module.scss';

// MUI imports
import { Edit, SwapVert } from '@mui/icons-material';

// Types imports
import { RepliesFromDB } from '@/types/repliesTypes';

// Components imports

// Context imports

// Helper functions imports
import { parseReplyContent } from '@/lib/helperFunctions';

// Library imports
import { useState } from 'react';

const RepliesTable = ({ replies }: { replies: RepliesFromDB[] }) => {
	console.log('All replies:', replies);

	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
	const [selectedReply, setSelectedReply] = useState<number | null>(null);
	const { mutateAsync: updateReply } = useReplyUpdate();

	const handleSort = () => {
		setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
	};

	const handleClick = (replyId: number) => {
		if (selectedReply === replyId) {
			setSelectedReply(null);
		} else {
			setSelectedReply(replyId);
		}
	};

	const handleUpdate = (replyId: number) => {
		updateReply(replyId);
	};

	const sortedReplies = [...replies].sort((a, b) => {
		const dateA = new Date(a.createdAt).getTime();
		const dateB = new Date(b.createdAt).getTime();
		return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
	});

	if (replies && !replies.length) {
		return (
			<div className={styles.activity}>
				<p>No replies</p>
			</div>
		);
	}

	return (
		<table className={styles.table}>
			<thead className={styles.tableHeader}>
				<tr>
					<th className={styles.sm}>Name</th>
					<th className={styles.md}>Subject</th>
					<th className={styles.lrg}>Content</th>
					<th className={styles.sm}>Status</th>
					<th className={styles.sm} onClick={() => handleSort()}>
						<span className={styles.sort}>
							Reply Date
							<SwapVert fontSize='small' />
						</span>
					</th>
					<th colSpan={2} className={`${styles.sm} ${styles.center}`}>
						View Sequence
					</th>
				</tr>
			</thead>
			<tbody>
				{sortedReplies.map((reply) => {
					const replyDateDay = new Date(reply.createdAt);
					const parsedContent = parseReplyContent(reply.replyContent);
					const replyStatus = reply.processed ? 'Read' : 'Unread';
					const contactName = reply.contact?.firstName
						? reply.contact.firstName + ' ' + reply.contact?.lastName
						: 'Unknown';

					return (
						<tr
							key={reply.id}
							onClick={() => handleClick(reply.id)}
							className={
								selectedReply === reply.id ? styles.selectedMessage : ''
							}
						>
							<td className={`${styles.sm} ${styles.name}`}>{contactName}</td>
							<td className={`${styles.md} ${styles.subject}`}>
								{reply.replySubject}
							</td>

							<td
								className={`${styles.lrg} ${styles['content-cell']} ${styles.content}`}
							>
								<div className={styles['parsed-content']}>
									<span className={styles['message-preview']}>
										{parsedContent[0]}
									</span>
									{selectedReply === reply.id &&
										parsedContent.length > 1 &&
										parsedContent
											.slice(1)
											.map((text, index) => <span key={index}>{text}</span>)}
								</div>
							</td>

							<td className={`${styles.sm} ${styles.status}`}>{replyStatus}</td>

							<td className={`${styles.sm} ${styles.right} ${styles.date}`}>
								{replyDateDay.toLocaleDateString()}
							</td>
							<td className={`${styles.sm} ${styles.right}`}>
								<Link href={`/dashboard/contacts/${reply.contactId}`}>
									View
								</Link>
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default RepliesTable;
