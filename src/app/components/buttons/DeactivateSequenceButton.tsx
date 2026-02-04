'use client';

// Styles imports
import styles from './buttons.module.scss';

// MUI imports
import { Close } from '@mui/icons-material';

// Context imports
import { useAppContext } from '@/app/context/AppContext';
import { useEmailContext } from '@/app/context/EmailContext';

const DeactivateSequenceButton = ({ sequenceId }: { sequenceId: number }) => {
	const { setModalType } = useAppContext();
	const { setSelectedSequenceId } = useEmailContext();

	const handleClick = () => {
		setSelectedSequenceId(sequenceId);
		setModalType('deactivateSequence');
	};

	return (
		<button
			type='button'
			className={styles['edit-contact-button']}
			onClick={handleClick}
		>
			<Close />
			<span>Deactivate Sequence</span>
		</button>
	);
};

export default DeactivateSequenceButton;
