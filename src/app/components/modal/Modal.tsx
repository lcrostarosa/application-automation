'use client';

// Styles imports
import styles from './modal.module.scss';

// Components imports
import CloseButton from '../buttons/CloseButton';

// Context ipmorts
import { useAppContext } from '@/app/context/AppContext';

// Modals
import AuthModal from './modalTypes/auth/AuthModal';
import RegisterModal from './modalTypes/auth/register/RegisterModal';
import LoginModal from './modalTypes/auth/login/LoginModal';
import NewContactModal from './modalTypes/contacts/NewContactModal';
import SearchContactsModal from './modalTypes/contacts/SearchContactsModal';

const Modal = ({ backupModalType }: { backupModalType?: string }) => {
	const { modalType, setModalType, setIsModalOpen, duplicateContact } =
		useAppContext();

	const currentModalType = modalType || backupModalType || null;

	if (!currentModalType) {
		return null;
	}

	const handleClose = () => {
		setIsModalOpen(false);
		setModalType(modalType === 'login' ? 'auth' : null);
	};

	interface ModalContent {
		[key: string]: {
			component: React.ReactNode;
			title: string;
			width?: string;
		};
	}

	const modalContent: ModalContent = {
		auth: {
			component: <AuthModal />,
			title: 'Welcome! Please log in to access your protected content.',
			width: '31.5rem',
		},
		register: {
			component: <RegisterModal />,
			title: 'Registration is closed at this time.',
			width: '31.5rem',
		},
		login: {
			component: <LoginModal />,
			title: 'Sign In',
			width: '31.5rem',
		},
		newContact: {
			component: <NewContactModal />,
			title: duplicateContact ? 'Update Existing Contact' : 'New Contact',
			width: '31.5rem',
		},
		searchContacts: {
			component: <SearchContactsModal />,
			title: 'Contacts',
		},
	} as const;

	return (
		<div className={styles.modalScreen} onClick={() => setModalType(null)}>
			<div
				className={styles.modalContainer}
				style={{ maxWidth: modalContent[currentModalType].width }}
			>
				<div
					className={styles.modalContent}
					onClick={(e) => e.stopPropagation()}
				>
					<div className={styles.modalHeader}>
						<h2>{modalContent[currentModalType].title}</h2>
					</div>
					<div className={styles.modalBody}>
						{modalContent[currentModalType].component}
					</div>
				</div>
				{currentModalType &&
					currentModalType !== 'auth' &&
					currentModalType !== 'register' && (
						<CloseButton onClick={handleClose} />
					)}
			</div>
		</div>
	);
};

export default Modal;
