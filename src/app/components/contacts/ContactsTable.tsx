'use client';

// Library imports
import { useState } from 'react';

// Hooks imports

// Styles imports
import styles from './contactsTable.module.scss';

// MUI imports
import { SwapVert } from '@mui/icons-material';

// Components imports

// Context imports
import { useAppContext } from '@/app/context/AppContext';

// Types imports
import { ContactFromDB } from '@/types/contactTypes';

const ContactsTable = ({
	contacts,
	onRowClick,
	columns,
}: {
	contacts: ContactFromDB[];
	onRowClick: (contact: ContactFromDB) => void;
	columns: {
		associatedRole: boolean;
		importance: boolean;
		lastActivity: boolean;
		linkedIn: boolean;
		phone: boolean;
		replied: boolean;
	};
}) => {
	const { setSelectedContact } = useAppContext();
	type SortableContactColumn = 'firstName' | 'lastName' | 'company';

	const [sortBy, setSortBy] = useState<SortableContactColumn | null>(null);
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
		onRowClick(contact);
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
					{columns.importance && <th className={styles.sm}>Priority</th>}
					{columns.phone && <th className={styles.md}>Phone</th>}
					<th className={styles.lrg}>Email</th>
					{columns.linkedIn && <th className={styles.md}>LinkedIn</th>}
					{columns.lastActivity && (
						<th className={styles.sm}>Last Contacted</th>
					)}
					{columns.replied && <th className={styles.sm}>Replied</th>}
					{columns.associatedRole && (
						<th className={styles.lrg}>Role Applied</th>
					)}
				</tr>
			</thead>
			<tbody>
				{sortedContacts.map((contact) => (
					<tr key={contact.email} onClick={() => handleClick(contact)}>
						<td className={styles.sm}>{contact.firstName}</td>
						<td className={styles.sm}>{contact.lastName}</td>
						<td className={styles.md}>{contact.company}</td>
						<td className={styles.md}>{contact.title}</td>
						{columns.importance && (
							<td className={`${styles.sm} ${styles.right}`}>
								{contact.importance}
							</td>
						)}
						{columns.phone && (
							<td className={`${styles.sm} ${styles.right}`}>
								{contact.phone}
							</td>
						)}
						<th className={styles.lrg}>{contact.email}</th>
						{columns.linkedIn && (
							<td className={styles.md}>{contact.linkedIn}</td>
						)}
						{columns.lastActivity && (
							<td className={`${styles.sm} ${styles.right}`}>
								{contact.lastActivity
									? new Date(contact.lastActivity).toLocaleDateString()
									: ''}
							</td>
						)}
						{columns.replied && (
							<td className={`${styles.sm} ${styles.right}`}>
								{contact.replied ? 'Yes' : 'No'}
							</td>
						)}
						{columns.associatedRole && (
							<td className={styles.lrg}>{contact.associatedRole}</td>
						)}
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default ContactsTable;
