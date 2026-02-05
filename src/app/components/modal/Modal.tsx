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
import EditContactModal from './modalTypes/contacts/EditContactModal';
import DeleteContactModal from './modalTypes/contacts/DeleteContactModal';
import ErrorModal from './modalTypes/error/ErrorModal';
import OverrideModal from './modalTypes/error/OverrideModal';
import AlertModal from './modalTypes/alert/AlertModal';
import DeactivateSequenceModal from './modalTypes/sequence/DeactivateSequenceModal';

const Modal = ({ backupModalType }: { backupModalType?: string }) => {
	const {
		modalType,
		setModalType,
		setIsModalOpen,
		duplicateContact,
		selectedContact,
		setSelectedContact,
		setDuplicateContact,
		errors,
		clearErrors,
		alertMessage,
		setAlertMessage,
	} = useAppContext();

	const currentModalType = modalType || backupModalType || null;

	if (!currentModalType) {
		return null;
	}

	const handleClose = () => {
		setIsModalOpen(false);
		setModalType(modalType === 'login' ? 'auth' : null);
		if (modalType === 'editContact') {
			setSelectedContact(null);
			setDuplicateContact(false);
		}
		if (modalType === 'deleteContact') {
			setSelectedContact(null);
		}
		if (modalType === 'error') {
			clearErrors();
		}
		if (modalType === 'alert') {
			setAlertMessage(null);
		}
	};

	interface ModalContent {
		[key: string]: {
			component: React.ReactNode;
			title?: string;
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
		editContact: {
			component: <EditContactModal selectedContact={selectedContact!} />,
			title: 'Edit Contact',
			width: '31.5rem',
		},
		newContactFromNewEmail: {
			component: <EditContactModal selectedContact={selectedContact!} />,
			title: 'Action Required:',
			width: '31.5rem',
		},
		deleteContact: {
			component: <DeleteContactModal selectedContact={selectedContact!} />,
			title: 'Delete Contact',
			width: '31.5rem',
		},
		error: {
			component: <ErrorModal errors={errors} clearErrors={clearErrors} />,
			title: 'Error(s):',
			width: '31.5rem',
		},
		override: {
			component: <OverrideModal />,
			title: 'Conflict: Existing Sequence',
			width: '31.5rem',
		},
		alert: {
			component: (
				<AlertModal clearAlert={handleClose} message={alertMessage!} />
			),
			width: '31.5rem',
		},
		deactivateSequence: {
			component: <DeactivateSequenceModal />,
			title: 'Deactivate Sequence',
			width: '31.5rem',
		},
		deactivateAllSequences: {
			component: <DeactivateSequenceModal allSequences={true} />,
			title: 'Deactivate All Sequences',
			width: '31.5rem',
		},
	} as const;

	return (
		<div className={styles.modalScreen}>
			<div
				className={styles.modalContainer}
				style={{ maxWidth: modalContent[currentModalType].width }}
			>
				<div
					className={styles.modalContent}
					onClick={(e) => e.stopPropagation()}
				>
					{modalContent[currentModalType].title && (
						<div className={styles.modalHeader}>
							<h2
								className={
									modalContent[currentModalType].title === 'Action Required:'
										? styles.alert
										: ''
								}
							>
								{modalContent[currentModalType].title}
								{modalContent[currentModalType].title === 'Action Required:' ? (
									<span> Edit Contact</span>
								) : null}
							</h2>
						</div>
					)}
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
