// Styles imports
import styles from './topBar.module.scss';

// Components imports
import LogoutButton from '../buttons/LogoutButton';

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
					<h1
						className={styles.appTitle}
						id='app-title'
						aria-label='Application Automation - Main application title'
					>
						Application Autom<span>ai</span>tion
					</h1>
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
