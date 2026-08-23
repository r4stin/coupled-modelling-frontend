import '@/app/globals.css';

import { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { FC } from 'react';

import Providers from '@/components/Providers/Providers';

export const metadata: Metadata = {
    title: {
        template: '%s | Coupled Modelling',
        default: 'Coupled Modelling Explorer',
    },
    description: 'Explorer for the coupled multiphysics simulation knowledge base (Kratos CoSimulation → OWL/GraphDB)',
};

type Props = {
    children: React.ReactNode;
};

const RootLayout: FC<Props> = ({ children }) => {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <NuqsAdapter>
                    <Providers>{children}</Providers>
                </NuqsAdapter>
            </body>
        </html>
    );
};

export default RootLayout;
