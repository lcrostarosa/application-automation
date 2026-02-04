'use client';

// Library imports
import { useState } from 'react';

// Hooks imports

// Styles imports
import styles from './contactPage.module.scss';

// Icon imports

// Components imports
import NewEmailForm from '@/app/components/forms/newEmail/NewEmailForm';
import ActiveSequence from '@/app/components/sequences/active/ActiveSequence';
import PreviousSequencesTable from '@/app/components/sequences/PreviousSequencesTable';
import AllActivitiesTable from '@/app/components/sequences/AllActivitiesTable';

// Context imports

// Types imports
import { ContactFromDB } from '@/types/contactTypes';
import { SequencesResponse, SequenceFromDB } from '@/types/sequenceTypes';
import { MessagesWithActiveSequence } from '@/types/messageTypes';

const ContactActivities = ({
	contact,
	sequences,
	allMessages,
}: {
	contact: ContactFromDB;
	sequences: SequencesResponse;
	allMessages: MessagesWithActiveSequence[];
}) => {
	type SelectedType = 'active' | 'previous' | 'email' | 'all';
	const [selected, setSelected] = useState<SelectedType>('active');

	interface ActivityContent {
		[key: string]: {
			component: React.ReactNode;
		};
	}

	const { sequences: sequenceList } = sequences;
	const messageList = allMessages;

	const activeSequence: SequenceFromDB | undefined = sequenceList.find(
		(seq) => seq.active
	);
	const previousSequences: SequenceFromDB[] = sequenceList.filter(
		(seq) => !seq.active
	);

	const activityContent: ActivityContent = {
		active: {
			component: activeSequence ? (
				<ActiveSequence sequence={activeSequence} />
			) : (
				<div className={styles.activity}>
					<p>No active sequences</p>
				</div>
			),
		},
		previous: {
			component:
				previousSequences.length > 0 ? (
					<PreviousSequencesTable sequences={previousSequences} />
				) : (
					<div className={styles.activity}>
						<p>No previous sequences</p>
					</div>
				),
		},
		email: {
			component: <NewEmailForm contactEmail={contact.email} />,
		},
		all: {
			component: <AllActivitiesTable messages={messageList} />,
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
					className={selected === 'all' ? styles.selected : ''}
					onClick={() => setSelected('all')}
				>
					All Activities {/* Email History */}
				</h2>

				<h2
					className={selected === 'email' ? styles.selected : ''}
					onClick={() => setSelected('email')}
				>
					New Email
				</h2>
			</div>
			<div className={styles.content}>
				{activityContent[selected].component}
			</div>
		</section>
	);
};

export default ContactActivities;
