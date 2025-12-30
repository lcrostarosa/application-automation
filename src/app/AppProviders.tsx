'use client';

import { ContextProvider } from '@/app/context/AppContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Auth0Provider } from '@auth0/nextjs-auth0';

const queryClient = new QueryClient();

export default function AppProviders({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<QueryClientProvider client={queryClient}>
			<ContextProvider>
				<Auth0Provider>{children}</Auth0Provider>
			</ContextProvider>
		</QueryClientProvider>
	);
}
