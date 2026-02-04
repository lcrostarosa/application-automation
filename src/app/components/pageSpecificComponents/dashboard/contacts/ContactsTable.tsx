'use client';

// Library imports
import { useState } from 'react';

// Styles imports
import styles from './contactsTable.module.scss';

// MUI imports
import { SwapVert } from '@mui/icons-material';

// Context imports
import { useAppContext } from '@/app/context/AppContext';

// Types imports
import { ContactFromDB } from '@/types/contactTypes';

const ContactsTable = ({
	inModal,
	contacts,
	onRowClick,
	columns,
}: {
	inModal?: boolean;
	contacts: ContactFromDB[];
	onRowClick?: (contactId: number) => void;
	columns: {
		active?: boolean;
		reasonForEmail: boolean;
		importance: boolean;
		lastActivity: boolean;
		linkedIn: boolean;
		phone: boolean;
		replied: boolean;
	};
}) => {
	const { setSelectedContact } = useAppContext();
	type SortableContactColumn =
		| 'active'
		| 'firstName'
		| 'lastName'
		| 'company'
		| 'importance'
		| 'replied'
		| 'lastActivity';

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
		if (onRowClick) onRowClick(contact.id);
	};

	const sortedContacts = [...contacts].sort((a, b) => {
		if (!sortBy) return 0;
		const valA = (a[sortBy] || '').toString().toLowerCase();
		const valB = (b[sortBy] || '').toString().toLowerCase();
		if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
		if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
		return 0;
	});

	if (!contacts.length)
		return (
			<div className={styles.activity}>
				<p>No contacts found</p>
			</div>
		);

	return (
		<table
			className={`${styles['contacts-table']} ${inModal ? styles.inModal : ''}`}
		>
			<thead>
				<tr>
					{columns.active && (
						<th className={styles.sm} onClick={() => handleSort('active')}>
							<span className={styles.sort}>
								Active
								<SwapVert fontSize='small' />
							</span>
						</th>
					)}
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
					{columns.importance && (
						<th className={styles.sm} onClick={() => handleSort('importance')}>
							<span className={styles.sort}>
								Priority <SwapVert fontSize='small' />
							</span>
						</th>
					)}
					{columns.phone && <th className={styles.md}>Phone</th>}
					<th className={styles.lrg}>Email</th>
					{columns.linkedIn && <th className={styles.md}>LinkedIn</th>}
					{columns.lastActivity && (
						<th
							className={styles.md}
							onClick={() => handleSort('lastActivity')}
						>
							<span className={styles.sort}>
								Last Contacted <SwapVert fontSize='small' />
							</span>
						</th>
					)}
					{columns.replied && (
						<th className={styles.sm} onClick={() => handleSort('replied')}>
							<span className={styles.sort}>
								Replied <SwapVert fontSize='small' />
							</span>
						</th>
					)}
					{columns.reasonForEmail && (
						<th className={styles.lrg}>Reason For Reaching Out:</th>
					)}
				</tr>
			</thead>
			<tbody>
				{sortedContacts.map((contact) => {
					return (
						<tr
							key={contact.id ?? contact.email}
							onClick={() => handleClick(contact)}
						>
							{columns.active && (
								<td className={styles.sm}>{contact.active ? 'Yes' : 'No'}</td>
							)}
							<td className={styles.sm}>
								{contact.firstName ? contact.firstName : '-'}
							</td>
							<td className={styles.sm}>
								{contact.lastName ? contact.lastName : '-'}
							</td>
							<td className={styles.lrg}>
								{contact.company ? contact.company : '-'}
							</td>
							<td className={styles.md}>
								{contact.title ? contact.title : '-'}
							</td>
							{columns.importance && (
								<td
									className={`${styles.sm} ${
										contact.importance ? styles.right : ''
									}`}
								>
									{contact.importance ? contact.importance : '-'}
								</td>
							)}
							{columns.phone && (
								<td
									className={`${styles.md} ${
										contact.phone ? styles.right : ''
									}`}
								>
									{contact.phone ? contact.phone : '-'}
								</td>
							)}
							<td className={styles.lrg}>{contact.email}</td>
							{columns.linkedIn && (
								<td className={styles.md}>
									{contact.linkedIn ? contact.linkedIn : '-'}
								</td>
							)}
							{columns.lastActivity && (
								<td className={`${styles.md} ${styles.right}`}>
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
							{columns.reasonForEmail && (
								<td className={styles.lrg}>
									{contact.reasonForEmail ? contact.reasonForEmail : '-'}
								</td>
							)}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default ContactsTable;
