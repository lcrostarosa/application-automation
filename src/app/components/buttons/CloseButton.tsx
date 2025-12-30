'use client';

// MUI Icons
import { Close } from '@mui/icons-material';

interface CloseButtonProps {
	onClick: () => void;
}

export default function CloseButton({ onClick }: CloseButtonProps) {
	return (
		<button
			onClick={onClick}
			className='close'
			role='button'
			aria-label='Close the modal'
		>
			<Close style={{ fontSize: '1.75rem' }} />
		</button>
	);
}
