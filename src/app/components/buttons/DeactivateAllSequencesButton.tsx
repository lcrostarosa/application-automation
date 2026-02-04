'use client';

// Styles imports
import styles from './buttons.module.scss';

// MUI imports
import { Close } from '@mui/icons-material';

// Context imports
import { useAppContext } from '@/app/context/AppContext';

// Types imports

const DeactivateAllSequencesButton = () => {
	const { setModalType } = useAppContext();

	const handleClick = () => {
		setModalType('deactivateAllSequences');
	};

	return (
		<button
			type='button'
			className={styles['deactivate-all-sequences-button']}
			onClick={handleClick}
		>
			<Close />
			<span>Deactivate All Sequences</span>
		</button>
	);
};

export default DeactivateAllSequencesButton;
