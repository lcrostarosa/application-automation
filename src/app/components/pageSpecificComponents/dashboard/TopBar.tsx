import Link from 'next/link';

// Styles imports
import styles from './topBar.module.scss';

// Components imports
import LogoutButton from '../../buttons/LogoutButton';

interface TopBarProps {
	userName: string;
}

export default function TopBar({ userName }: TopBarProps) {
	return (
		<>
			<header
				className={styles.topBar}
				role='banner'
				aria-label='Application header'
			>
				<div className={styles.topBarContent}>
					<Link href='/'>
						<h1
							className={styles.appTitle}
							id='app-title'
							aria-label='Application Automation - Main application title'
						>
							Repl<span>ai</span>All
						</h1>
					</Link>
					<div
						className={styles.userSection}
						role='region'
						aria-label='User account section'
					>
						<span
							className={styles.welcomeText}
							aria-label={`Welcome message for ${userName}`}
						>
							Welcome, {userName}
						</span>
						<LogoutButton />
					</div>
				</div>
			</header>
		</>
	);
}
