// Library imports
import React from 'react';
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';

// Styles imports
import styles from './dashboard.module.scss';

// Components imports
import TopBar from '../components/dashboard/TopBar';
import SideBar from '../components/dashboard/SideBar';
import Modal from '../components/modal/Modal';

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth0.getSession();
	const user = session?.user;

	// Redirect unauthenticated users to home
	if (!user) {
		redirect('/');
	}

	const { findOrCreateUser } = await import('@/services/userService');
	await findOrCreateUser(user);

	return (
		<>
			<div
				className={styles.dashboardLayout}
				role='application'
				aria-labelledby='app-title'
			>
				{/* Top Bar */}
				<TopBar userName={user?.given_name || 'User'} />

				<div className={styles.mainContent} role='main'>
					{/* Side Bar */}
					<SideBar />

					{/* Main Content Area */}
					<main
						className={styles.dashboardContent}
						role='main'
						aria-label='Dashboard main content'
						id='main-content'
						tabIndex={-1}
					>
						{children}
					</main>
				</div>
			</div>
			<Modal />
		</>
	);
}
