import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';

import styles from './home.module.scss';

// import AuthSection from './components/modals/modalTypes/auth/AuthSection';
import Modal from './components/modal/Modal';

export default async function Home() {
	const session = await auth0.getSession();
	const user = session?.user;

	if (user) {
		redirect('/dashboard');
	}

	return (
		<div
			className={styles['home-container']}
			role='main'
			aria-label='Login page'
		>
			<div className='main-card-wrapper'>
				<section
					className='action-card'
					aria-labelledby='login-heading'
					role='region'
				>
					<Modal backupModalType='auth' />
				</section>
			</div>
		</div>
	);
}
