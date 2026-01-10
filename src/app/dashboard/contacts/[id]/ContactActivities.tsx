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
import {
	StandaloneMessagesResponse,
	MessageFromDB,
} from '@/types/messageTypes';

const ContactActivities = ({
	contact,
	sequences,
	standaloneMessages,
}: {
	contact: ContactFromDB;
	sequences: SequencesResponse;
	standaloneMessages: StandaloneMessagesResponse;
}) => {
	type SelectedType = 'active' | 'previous' | 'email' | 'all';
	const [selected, setSelected] = useState<SelectedType>('active');

	interface ActivityContent {
		[key: string]: {
			component: React.ReactNode;
		};
	}

	const { sequences: sequenceList } = sequences;
	const { messages: messageList } = standaloneMessages;

	const activeSequence: SequenceFromDB | undefined = sequenceList.find(
		(seq) => seq.active
	);
	const previousSequences: SequenceFromDB[] = sequenceList.filter(
		(seq) => !seq.active
	);

	// interface PreviousActivity {
	// 	type: 'message' | 'sequence';
	// 	sortDate: Date;
	// 	details: MessageFromDB | SequenceFromDB;
	// }

	// let previousActivities: PreviousActivity[] = [];

	// messageList.forEach((message) => {
	// 	previousActivities.push({
	// 		type: 'message',
	// 		sortDate: new Date(message.createdAt),
	// 		details: message,
	// 	});
	// });

	// previousSequences.forEach((sequence) => {
	// 	previousActivities.push({
	// 		type: 'sequence',
	// 		sortDate: new Date(sequence.endDate!),
	// 		details: sequence,
	// 	});
	// });

	// NEED TO TAKE PREVIOUS ACTIVITIES AND PREVIOUS SEQUENCES AND EXTRACT ALL MESSAGES FROM EACH INTO ONE ARRAY TO PASS TO ALL ACTIVITIES TABLE

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
					<PreviousSequencesTable
						sequences={previousSequences}
						// previousActivities={previousActivities}
					/>
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
			component: <AllActivitiesTable sequences={[]} previousActivities={[]} />,
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
					All Activities
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
