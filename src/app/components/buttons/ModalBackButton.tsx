'use client';

// Context imports
import { useAppContext } from '@/app/context/AppContext';

const ModalBackButton = ({
	modalRedirect,
	title,
}: {
	modalRedirect: string;
	title: string;
}) => {
	const { setModalType } = useAppContext();

	const handleClick = () => {
		setModalType(modalRedirect);
	};

	return (
		<button
			onClick={handleClick}
			className='button back'
			role='button'
			aria-label={`Open ${title} modal`}
		>
			{title}
		</button>
	);
};

export default ModalBackButton;
