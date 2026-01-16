// Services imports
import { getAllPendingMessages } from '@/services/messageService';

// Hooks imports

// Styles imports
import styles from './pendingPage.module.scss';

// Components imports
import PendingMessagesClient from './PendingMessagesClient';

// Context imports

const Page = async () => {
	const { messages } = await getAllPendingMessages();

	return (
		<div className={styles['page-wrapper']}>
			<section className={styles['header-section']}>
				<h1 className={styles.welcomeTitle} id='pending-messages-title'>
					Pending Messages
				</h1>
				<p
					className={styles.welcomeSubtitle}
					aria-describedby='pending-messages-title'
				>
					Approve or edit pending messages.
				</p>
			</section>

			<section className={styles['messages-table']}>
				<PendingMessagesClient initialMessages={messages} />
			</section>
		</div>
	);
};

export default Page;
