// Styles imports
import styles from './authModal.module.scss';

// Components imports
import ModalActionButton from '@/app/components/buttons/ModalActionButton';

// Context imports

const AuthModal = () => {
	return (
		<div className={styles.authModal}>
			<ModalActionButton modalType='register' />
			<ModalActionButton modalType='login' />
		</div>
	);
};

export default AuthModal;
