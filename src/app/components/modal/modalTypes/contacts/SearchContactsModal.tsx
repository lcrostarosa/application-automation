'use client';

// Library imports

// Hooks imports
import { useContactsGetAll } from '@/hooks/useContact';

// Styles imports
import styles from './searchContactsModal.module.scss';

// MUI imports
import { Refresh } from '@mui/icons-material';

// Components imports
import SearchBar from '@/app/components/ui/searchBar/SearchBar';
import ContactsTable from '@/app/components/contacts/ContactsTable';

// Context imports
import { useAppContext } from '@/app/context/AppContext';

// Types imports

const SearchContactsModal = () => {
	const { setModalType } = useAppContext();
	const { data: contactsData, error, loading, refetch } = useContactsGetAll();

	const contacts = contactsData?.contacts || [];

	const onRowClick = () => {
		setModalType(null);
	};

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
			<ContactsTable
				contacts={contacts}
				onRowClick={onRowClick}
				columns={{
					associatedRole: false,
					importance: false,
					lastActivity: true,
					linkedIn: false,
					phone: false,
					replied: false,
				}}
			/>
		</div>
	);
};

export default SearchContactsModal;
