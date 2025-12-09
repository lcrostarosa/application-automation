import type { Metadata } from 'next';
import { Auth0Provider } from '@auth0/nextjs-auth0';
import './reset.css';
import './globals.scss';

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
				<Auth0Provider>
					<div id='root' role='application'>
						{children}
					</div>
					<div id='modal-root' aria-live='polite' aria-atomic='true'></div>
				</Auth0Provider>
			</body>
		</html>
	);
}
