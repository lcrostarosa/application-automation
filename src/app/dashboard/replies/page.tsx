'use client';

import { useGetAllReplies, useCheckNewReplies } from '@/hooks/useReplies';
import styles from './repliesPage.module.scss';

export default function RepliesPage() {
	const { data: replies = [], isPending: _isPending, refetch } = useGetAllReplies();
	const { mutateAsync: checkForNewReplies, isPending: checking, error: _error } =
		useCheckNewReplies();

	const handleCheckReplies = async () => {
		try {
			await checkForNewReplies(undefined);
			refetch(); // Refresh replies after checking
		} catch {
			// Error handling is done in the hook
		}
	};

	return (
		<div className={styles.repliesPage}>
			<div className={styles.header}>
				<h1>Email Replies</h1>
				<button
					onClick={handleCheckReplies}
					disabled={checking}
					className={styles.checkButton}
				>
					{checking ? 'Checking...' : 'Check for New Replies'}
				</button>
			</div>

			{!replies || replies.length === 0 ? (
				<div className={styles.emptyState}>
					<p>No replies yet. Send some emails and check back!</p>
				</div>
			) : (
				<div className={styles.repliesGrid}>
					{replies.map((reply) => (
						<div key={reply.id} className={styles.replyCard}>
							<div className={styles.replyHeader}>
								<h3>{reply.contact.firstName || reply.contact.email}</h3>
								<span className={styles.date}>
									{new Date(reply.date).toLocaleDateString()}
								</span>
							</div>
							<div className={styles.subject}>{reply.replySubject}</div>
							<div
								className={styles.content}
								style={{ whiteSpace: 'pre-wrap' }}
							>
								{reply.replyContent}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
