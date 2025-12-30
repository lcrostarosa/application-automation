import type { Metadata } from 'next';

import AppProviders from './AppProviders';

// Styles imports
import './reset.css';
import './globals.scss';

// Component imports

export const metadata: Metadata = {
	title: 'Application Automation - Automate Your Job Application Follow-ups',
	description:
		'A comprehensive application follow-up management system to automate follow-up emails, track responses, and manage your job search communications.',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body>
				<AppProviders>
					<div id='root' role='application'>
						{children}
					</div>
					<div id='modal-root' aria-live='polite' aria-atomic='true'></div>
				</AppProviders>
			</body>
		</html>
	);
}
