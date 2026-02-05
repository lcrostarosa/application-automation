import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a fresh query client for each test
function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
				staleTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});
}

interface WrapperProps {
	children: ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
	queryClient?: QueryClient;
}

function createWrapper(queryClient: QueryClient) {
	return function Wrapper({ children }: WrapperProps) {
		return (
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		);
	};
}

function customRender(
	ui: ReactElement,
	options: CustomRenderOptions = {}
) {
	const { queryClient = createTestQueryClient(), ...renderOptions } = options;

	return {
		...render(ui, {
			wrapper: createWrapper(queryClient),
			...renderOptions,
		}),
		queryClient,
	};
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render, createTestQueryClient };
