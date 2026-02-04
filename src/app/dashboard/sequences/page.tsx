// Libraries imports
import { redirect } from 'next/navigation';

// Services imports
import { getAllSequencesByUserId } from '@/services/sequenceService';
import { getApiUser } from '@/services/getUserService';

// Styles imports
import styles from './sequencesClient.module.scss';

// Components imports
import SequencesClient from './SequencesClient';

const Page = async () => {
	const { user } = await getApiUser();

	if (!user) {
		redirect('/');
	}

	const { sequences } = await getAllSequencesByUserId();

	return (
		<div className={styles['page-wrapper']}>
			<section className={styles['header-section']}>
				<h1 className={styles.welcomeTitle} id='sequences-title'>
					Sequences
				</h1>
				<p
					className={styles.welcomeSubtitle}
					aria-describedby='sequences-title'
				>
					View all active and previous sequences.
				</p>
			</section>

			<section className={styles['sequences-content']}>
				<SequencesClient initialSequences={sequences} />
			</section>
		</div>
	);
};

export default Page;
