// Library imports
import React from 'react';

// Styles imports
import styles from './sideBar.module.scss';

// Components imports
import NavigationItem from '../navigationItem/NavigationItem';

// MUI imports
import {
	SpaceDashboardRounded,
	GroupsRounded,
	ViewTimelineRounded,
	ScheduleSendRounded,
	MailOutlineRounded,
	ContentCopyRounded,
	TimelineRounded,
	SettingsRounded,
} from '@mui/icons-material';

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
		{
			href: '/dashboard',
			label: 'Dashboard',
			icon: <SpaceDashboardRounded className={styles.icon} />,
		},
		{
			href: '/dashboard/contacts',
			label: 'Contacts',
			icon: <GroupsRounded className={styles.icon} />,
		},
		{
			href: '/dashboard/sequences',
			label: 'Sequences',
			icon: <ViewTimelineRounded className={styles.icon} />,
		},
		{
			href: '/dashboard/pending',
			label: 'Pending',
			icon: <ScheduleSendRounded className={styles.icon} />,
		},
		{
			href: '/dashboard/replies',
			label: 'Replies',
			icon: <MailOutlineRounded className={styles.icon} />,
		},
		// { href: '/dashboard/in-progress', label: 'In Progress' },
		{
			href: '/dashboard/templates',
			label: 'Templates (Coming Soon)',
			icon: <ContentCopyRounded className={styles.icon} />,
		},
		{
			href: '/dashboard/analytics',
			label: 'Analytics (Coming Soon)',
			icon: <TimelineRounded className={styles.icon} />,
		},
		{
			href: '/dashboard/settings',
			label: 'Settings',
			icon: <SettingsRounded className={styles.icon} />,
		},
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
							icon={item.icon}
						/>
					))}
				</ul>
			</nav>
		</aside>
	);
}
