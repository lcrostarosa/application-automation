// Services imports
import { getAllContacts } from '@/services/contactsService';

// Components imports
import ContactsClient from './ContactsClient';
import PageTemplate from '@/app/components/pageSpecificComponents/PageTemplate';

const Page = async () => {
	const contacts = await getAllContacts();

	return (
		<PageTemplate
			title='Contacts'
			description='Search contacts or add a new one.'
		>
			<ContactsClient initialContacts={contacts} />
		</PageTemplate>
	);
};

export default Page;
