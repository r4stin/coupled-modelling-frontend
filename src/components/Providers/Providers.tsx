'use client';

import { RouterProvider, ToastProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { I18nProvider } from 'react-aria-components';
import { SWRConfig } from 'swr';

const Providers = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    return (
        <NextThemesProvider attribute={['class', 'data-theme']} defaultTheme="light" enableSystem={false} storageKey="cm-theme">
            {/* Pinned locale: react-aria otherwise localizes its strings (tree chevron
                labels) from navigator.language, mismatching the en-US server HTML. */}
            <I18nProvider locale="en-US">
                <RouterProvider navigate={router.push}>
                    <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false }}>
                        {children}
                        <ToastProvider />
                    </SWRConfig>
                </RouterProvider>
            </I18nProvider>
        </NextThemesProvider>
    );
};

export default Providers;
