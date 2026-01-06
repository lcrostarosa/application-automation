// Library imports
import { redirect } from 'next/navigation';

// Services imports
import { getContactById } from '@/services/contactsService';
import { getSequencesByContactId } from '@/services/sequenceService';

// Styles imports
import styles from './contactPage.module.scss';

// MUI imports

// Component imports
import ContactDetailsClient from './ContactDetailsClient';

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;

	const contact = await getContactById(Number(id));
	const sequencesData = await getSequencesByContactId(Number(id));

	// console.log('Contact sequences:', sequencesData.sequences);

	if (!contact) {
		redirect('/dashboard/contacts');
	}

	return (
		<div className={styles['page-wrapper']}>
			<ContactDetailsClient
				initialContact={contact}
				initialSequences={sequencesData}
			/>
		</div>
	);
};

export default Page;
