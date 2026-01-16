// Library imports
import React from 'react';

// Styles imports
import styles from './sideBar.module.scss';

// Components imports
import NavigationItem from '../navigationItem/NavigationItem';

interface SidebarProps {
	currentPath?: string;
	notifications?: boolean;
}

export default function SideBar({
	currentPath,
	notifications = false,
}: SidebarProps) {
	// Navigation data
	const navigationItems = [
		{ href: '/dashboard/new-email', label: 'New Email' },
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/dashboard/contacts', label: 'Contacts' },
		{ href: '/dashboard/sequences', label: 'Sequences' },
		{ href: '/dashboard/pending', label: 'Pending' },
		{ href: '/dashboard/replies', label: 'Replies' },
		// { href: '/dashboard/in-progress', label: 'In Progress' },
		{ href: '/dashboard/templates', label: 'Templates (Coming Soon)' },
		{ href: '/dashboard/analytics', label: 'Analytics (Coming Soon)' },
		{ href: '/dashboard/settings', label: 'Settings' },
	];

	return (
		<aside
			className={styles.sideBar}
			aria-label='Main navigation'
			role='complementary'
		>
			<nav
				className={styles.navigation}
				aria-label='Dashboard navigation menu'
				role='navigation'
			>
				<ul className={styles.navList} role='list'>
					{navigationItems.map((item) => (
						<NavigationItem
							key={item.href}
							href={item.href}
							label={item.label}
							isActive={currentPath === item.href}
							notifications={notifications && item.label === 'Pending'}
						/>
					))}
				</ul>
			</nav>
		</aside>
	);
}
