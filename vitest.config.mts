import react from '@vitejs/plugin-react';
import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    root: '.',
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/setupTests.ts'],
        include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
        exclude: [...configDefaults.exclude],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            // Components render outside a Next.js runtime in tests, where the real hooks throw.
            'next/navigation': path.resolve(__dirname, './src/lib/nextNavigationMock.ts'),
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
});
