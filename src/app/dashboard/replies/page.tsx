// Services imports
import { getAllRepliesByUserId } from '@/services/repliesService';

// Hooks imports

// Styles imports
import styles from './repliesPage.module.scss';

// Components imports
import RepliesClient from './RepliesClient';

// Context imports

const Page = async () => {
	const { replies } = await getAllRepliesByUserId();

	return (
		<div className={styles['page-wrapper']}>
			<section className={styles['header-section']}>
				<h1 className={styles.welcomeTitle} id='replies-title'>
					Replies
				</h1>
				<p className={styles.welcomeSubtitle} aria-describedby='replies-title'>
					Replies to emails sent from the platform.
				</p>
			</section>

			<section className={styles['replies-table']}>
				<RepliesClient initialReplies={replies} />
			</section>
		</div>
	);
};

export default Page;
