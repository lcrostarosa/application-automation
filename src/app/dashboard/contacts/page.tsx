// Library imports
import React from 'react';

// Hooks imports

// Styles imports
import styles from './contacts.module.scss';

// MUI imports
import { Add } from '@mui/icons-material';

// Components imports
import SearchBar from '@/app/components/ui/searchBar/SearchBar';

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

				<div className={styles['add-contact']}>
					<button type='button' className={styles['add-contact-button']}>
						<Add />
						<span>New Contact</span>
					</button>
				</div>
			</section>

			<section className={styles['contacts-table']}></section>
		</div>
	);
};

export default Page;
