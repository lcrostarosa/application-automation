'use client';

// Library imports
import { useState } from 'react';

// Hooks imports

// Styles imports
import styles from './contactPage.module.scss';

// Icon imports

// Components imports
import NewEmailForm from '@/app/components/forms/newEmail/NewEmailForm';

// Context imports

// Types imports
import { ContactFromDB } from '@/types/contactTypes';
import { SequencesResponse } from '@/types/sequenceTypes';

const ContactActivities = ({
	contact,
	sequences,
}: {
	contact: ContactFromDB;
	sequences: SequencesResponse;
}) => {
	type SelectedType = 'active' | 'previous' | 'email';
	const [selected, setSelected] = useState<SelectedType>('active');

	interface ActivityContent {
		[key: string]: {
			component: React.ReactNode;
		};
	}

	const activityContent: ActivityContent = {
		active: {
			component: (
				<div className={styles.activity}>
					<p>No active sequences</p>
				</div>
			),
		},
		previous: {
			component: (
				<div className={styles.activity}>
					<p>No previous sequences</p>
				</div>
			),
		},
		email: {
			component: <NewEmailForm contactEmail={contact.email} />,
		},
	};

	return (
		<section className={styles['activities-wrapper']}>
			<div className={styles.nav}>
				<h2
					className={selected === 'active' ? styles.selected : ''}
					onClick={() => setSelected('active')}
				>
					Active Sequence
				</h2>

				<h2
					className={selected === 'previous' ? styles.selected : ''}
					onClick={() => setSelected('previous')}
				>
					Previous Sequences
				</h2>

				<h2
					className={selected === 'email' ? styles.selected : ''}
					onClick={() => setSelected('email')}
				>
					Send an Email
				</h2>
			</div>
			<div className={styles.content}>
				{activityContent[selected].component}
			</div>
		</section>
	);
};

export default ContactActivities;
