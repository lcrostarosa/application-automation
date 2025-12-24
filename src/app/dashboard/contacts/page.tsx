// Library imports
import React from 'react';

// Hooks imports

// Styles imports
import styles from './contacts.module.scss';

// MUI imports
import { Add } from '@mui/icons-material';

// Components imports
import SearchBar from '@/app/components/ui/searchBar/SearchBar';
import NewContactButton from '@/app/components/ui/buttons/NewContact';

const Page = () => {
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

			<section className={styles['contacts-table']}></section>
		</div>
	);
};

export default Page;
