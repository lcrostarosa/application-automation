'use client';

// Context imports
import { useAppContext } from '@/app/context/AppContext';

const ModalActionButton = ({ modalType }: { modalType: string }) => {
	const { setModalType } = useAppContext();

	const handleClick = () => {
		setModalType(modalType);
	};

	const buttonLabel = modalType.charAt(0).toUpperCase() + modalType.slice(1);

	return (
		<button
			onClick={handleClick}
			className={`button ${modalType}`}
			role='button'
			aria-label={`Open ${buttonLabel} modal`}
		>
			{buttonLabel}
		</button>
	);
};

export default ModalActionButton;
