import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.test.{ts,tsx}'],
		environmentMatchGlobs: [
			['src/**/*.test.tsx', 'jsdom'],
			['src/hooks/**/*.test.ts', 'jsdom'],
			['src/app/components/**/*.test.ts', 'jsdom'],
		],
		setupFiles: ['./src/__tests__/setup/vitest.setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/**/*.test.{ts,tsx}',
				'src/__tests__/**',
				'src/types/**',
			],
		},
	},
});
