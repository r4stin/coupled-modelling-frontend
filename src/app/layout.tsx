import '@/app/globals.css';

import { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { FC } from 'react';

import Header from '@/components/Layout/Header';
import Providers from '@/components/Providers/Providers';
import { APP_DESCRIPTION, APP_TITLE } from '@/constants/app';

export const metadata: Metadata = {
    title: {
        template: '%s | Coupled Modelling',
        default: APP_TITLE,
    },
    description: APP_DESCRIPTION,
};

type Props = {
    children: React.ReactNode;
};

const RootLayout: FC<Props> = ({ children }) => {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="flex h-dvh flex-col bg-background text-foreground">
                <NuqsAdapter>
                    <Providers>
                        <Header />
                        {children}
                    </Providers>
                </NuqsAdapter>
            </body>
        </html>
    );
};

export default RootLayout;
