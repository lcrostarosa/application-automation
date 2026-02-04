'use client';

// Library imports
import { useEffect } from 'react';
import { redirect } from 'next/navigation';

// Hooks imports
import { useQueryClient } from '@tanstack/react-query';
import { useContactsGetAll } from '@/hooks/useContact';

// Types imports
import type { ContactFromDB, ContactsResponse } from '@/types/contactTypes';

// Styles imports
import styles from './contactsClient.module.scss';

// Components imports
import SearchBar from '@/app/components/searchBar/SearchBar';
import NewContactButton from '@/app/components/buttons/NewContactButton';
import ContactsTable from '@/app/components/pageSpecificComponents/dashboard/contacts/ContactsTable';

export default function ContactsClient({
	initialContacts,
}: {
	initialContacts: ContactFromDB[];
}) {
	const queryClient = useQueryClient();

	// hydrate server data into the cache
	useEffect(() => {
		if (initialContacts) {
			queryClient.setQueryData<ContactsResponse>(['contacts-get-all'], {
				contacts: initialContacts,
			});
		}
	}, [initialContacts, queryClient]);

	const { data } = useContactsGetAll();
	const contacts = data?.contacts || [];

	const handleRowClick = (contactId: number) => {
		redirect(`/dashboard/contacts/${contactId}`);
	};

	return (
		<div className={styles.client}>
			<div className={styles['client-actions']}>
				<SearchBar
					placeholder='Search contacts...'
					className={styles['search-bar']}
				/>

				<NewContactButton />
			</div>

			<div className={styles['contacts-table']}>
				<ContactsTable
					contacts={contacts}
					onRowClick={(contactId) => handleRowClick(contactId)}
					columns={{
						active: true,
						reasonForEmail: true,
						importance: true,
						lastActivity: true,
						linkedIn: true,
						phone: true,
						replied: true,
					}}
				/>
			</div>
		</div>
	);
}
