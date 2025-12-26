'use client';

// Library imports
import { useState } from 'react';
import { useContactsGetAll } from '@/hooks/useContact';

// Hooks imports

// Styles imports
import styles from './searchContactsModal.module.scss';

// MUI imports
import { SwapVert, Refresh } from '@mui/icons-material';

// Components imports
import SearchBar from '@/app/components/ui/searchBar/SearchBar';

// Context imports
import { useAppContext } from '@/app/context/AppContext';

// Types imports
import { ContactFromDB } from '@/types/contactTypes';

const SearchContactsModal = () => {
	const { setSelectedContact, setModalType } = useAppContext();
	const { data: contactsData, error, loading, refetch } = useContactsGetAll();

	type SortableContactColumn = 'firstName' | 'lastName' | 'company';

	const [sortBy, setSortBy] = useState<SortableContactColumn | null>(null);
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

	const contacts = contactsData?.contacts || [];

	const handleSort = (column: SortableContactColumn) => {
		if (sortBy === column) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(column);
			setSortOrder('asc');
		}
	};

	const handleClick = (contact: ContactFromDB) => {
		setSelectedContact(contact);
		setModalType(null);
	};

	const sortedContacts = [...contacts].sort((a, b) => {
		if (!sortBy) return 0;
		const valA = (a[sortBy] || '').toString().toLowerCase();
		const valB = (b[sortBy] || '').toString().toLowerCase();
		if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
		if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
		return 0;
	});

	return (
		<div className={styles['searchcontactsmodal-wrapper']}>
			<div className={styles.controls}>
				<SearchBar placeholder='Search contacts...' />
				<button
					className={styles.refreshButton}
					type='button'
					onClick={refetch}
				>
					<Refresh className={styles.icon} />
				</button>
			</div>
			{error && <p style={{ color: 'red' }}>Error: {error}</p>}
			<table className={styles['contacts-table']}>
				<thead>
					<tr>
						<th className={styles.sm} onClick={() => handleSort('firstName')}>
							<span className={styles.sort}>
								First
								<SwapVert fontSize='small' />
							</span>
						</th>
						<th className={styles.sm} onClick={() => handleSort('lastName')}>
							<span className={styles.sort}>
								Last
								<SwapVert fontSize='small' />
							</span>
						</th>
						<th className={styles.lrg} onClick={() => handleSort('company')}>
							<span className={styles.sort}>
								Company
								<SwapVert fontSize='small' />
							</span>
						</th>
						<th className={styles.md}>Title</th>
						<th className={styles.lrg}>Email</th>
						<th className={styles.sm}>Last Contacted</th>
					</tr>
				</thead>
				<tbody>
					{sortedContacts.map((contact) => (
						<tr key={contact.email} onClick={() => handleClick(contact)}>
							<td className={styles.sm}>{contact.firstName}</td>
							<td className={styles.sm}>{contact.lastName}</td>
							<td className={styles.md}>{contact.company}</td>
							<td className={styles.md}>{contact.title}</td>
							<td className={styles.lrg}>{contact.email}</td>
							<td className={styles.sm}>
								{contact.lastActivity
									? new Date(contact.lastActivity).toLocaleDateString()
									: ''}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default SearchContactsModal;
