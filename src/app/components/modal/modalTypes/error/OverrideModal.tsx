// Library imports
import React from 'react';

// Hooks imports
import { useEmailSend } from '@/hooks/useEmail';

// Styles imports
import styles from './errorModal.module.scss';

// Components imports

// Context imports
import { useEmailContext } from '@/app/context/EmailContext';
import { useAppContext } from '@/app/context/AppContext';

// Type imports

const OverrideModal = () => {
	const { mutateAsync: sendEmail, isPending: sending } = useEmailSend();
	const { clearEmailContext, pendingEmail } = useEmailContext();
	const { setModalType } = useAppContext();

	const handleOverride = async () => {
		try {
			await sendEmail({ ...pendingEmail!, override: true });
			clearEmailContext();
		} catch (error) {
			// Error handling is managed in the hook
		}
	};

	return (
		<div className={styles['error-modal']}>
			<div className={styles.message}>
				<h2>
					An existing email sequence conflicts with the one you're trying to
					send.
				</h2>
				<h2>
					Would you like to <span style={{ fontWeight: '500' }}>override</span>{' '}
					(terminate) the existing sequence and send this email, starting a new
					sequence?
				</h2>
			</div>
			<div className={styles.buttons}>
				<button
					type='button'
					className='button override'
					onClick={handleOverride}
					disabled={sending}
				>
					Override
				</button>
				<button
					type='button'
					className='button cancel'
					onClick={() => {
						clearEmailContext();
						setModalType(null);
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	);
};

export default OverrideModal;
