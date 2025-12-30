// Library imports

// Hooks imports

// Styles imports
import styles from './registerModal.module.scss';

// Icon imports

// Components imports
import ModalBackButton from '@/app/components/buttons/ModalBackButton';

// Context imports

const RegisterModal = () => {
	return (
		<div className={styles.registerModal}>
			<ModalBackButton modalRedirect='auth' title='Back' />
		</div>
	);
};

export default RegisterModal;
