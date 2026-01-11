// Library imports
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Services imports
import { getContactById } from '@/services/contactsService';
import { getSequencesByContactId } from '@/services/sequenceService';
import { getAllMessagesByContactId } from '@/services/messageService';

// Styles imports
import styles from './contactPage.module.scss';

// MUI imports
import { Close } from '@mui/icons-material';

// Component imports
import ContactDetailsClient from './ContactDetailsClient';

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;

	const contact = await getContactById(Number(id));
	const sequencesData = (await getSequencesByContactId(Number(id))) || {
		sequences: [],
	};

	const { messages } = (await getAllMessagesByContactId(Number(id))) || {
		messages: [],
	};

	const { sequences } = sequencesData;

	const initialMessages = messages.map((message) => {
		const activeSequence = sequences.find(
			(sequence) => sequence.id === message.sequenceId && sequence.active
		);
		return { ...message, activeSequence: !!activeSequence };
	});

	if (!contact) {
		redirect('/dashboard/contacts');
	}

	return (
		<div className={styles['page-wrapper']}>
			<ContactDetailsClient
				initialContact={contact}
				initialSequences={sequencesData}
				initialAllMessages={initialMessages}
			/>
			<Link
				href='/dashboard/contacts'
				className={styles['close-button']}
				aria-label='Close contact'
			>
				<Close className={styles.icon} />
			</Link>
		</div>
	);
};

export default Page;
