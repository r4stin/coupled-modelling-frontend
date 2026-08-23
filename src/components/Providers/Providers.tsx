'use client';

import { RouterProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { SWRConfig } from 'swr';

const Providers = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    return (
        // Same theming setup as orkg-frontend: class + data-theme attributes, light default
        <NextThemesProvider attribute={['class', 'data-theme']} defaultTheme="light" enableSystem={false} storageKey="cm-theme">
            <RouterProvider navigate={router.push}>
                <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false }}>{children}</SWRConfig>
            </RouterProvider>
        </NextThemesProvider>
    );
};

export default Providers;
