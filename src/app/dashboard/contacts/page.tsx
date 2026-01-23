// Library imports

// Hooks imports

// Services imports
import { getAllContacts } from '@/services/contactsService';

// Styles imports
import styles from './contacts.module.scss';

// MUI imports

// Components imports
import SearchBar from '@/app/components/searchBar/SearchBar';
import NewContactButton from '@/app/components/buttons/NewContactButton';
import ContactsClient from './ContactsClient';

const Page = async () => {
	const contacts = await getAllContacts();

	return (
		<div className={styles['page-wrapper']}>
			<section className={styles['header-section']}>
				<h1 className={styles.welcomeTitle} id='contacts-title'>
					Contacts
				</h1>
				<p className={styles.welcomeSubtitle} aria-describedby='contacts-title'>
					Search contacts or add a new one.
				</p>
			</section>

			<section className={styles['contacts-actions']}>
				<SearchBar
					placeholder='Search contacts...'
					className={styles['search-bar']}
				/>

				<NewContactButton />
			</section>

			<section className={styles['contacts-table']}>
				<ContactsClient initialContacts={contacts} />
			</section>
		</div>
	);
};

export default Page;
