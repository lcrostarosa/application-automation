// Library imports
import Link from 'next/link';

// Styles imports
import styles from './navigationItem.module.scss';

interface NavigationItemProps {
	href: string;
	label: string;
	isActive?: boolean;
	notifications?: boolean;
}

export default function NavigationItem({
	href,
	label,
	isActive = false,
	notifications = false,
}: NavigationItemProps) {
	return (
		<li role='none'>
			<Link
				href={href}
				className={`${
					label !== 'New Email' ? styles.navLink : styles.actionButton
				} ${isActive ? styles.active : ''} ${
					notifications ? styles.notification : ''
				}`}
				aria-current={isActive ? 'page' : undefined}
				aria-label={`Navigate to ${label} page`}
			>
				<span>{label === 'Pending' ? 'Pending Emails' : label}</span>
			</Link>
		</li>
	);
}
