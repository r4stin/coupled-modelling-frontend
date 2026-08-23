import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { SWRConfig } from 'swr';

import Providers from '@/components/Providers/Providers';

/** The app's real provider stack, plus an isolated SWR cache per render. */
const AllProviders = ({ children }: { children: ReactNode }) => (
    <Providers>
        <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
    </Providers>
);

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => rtlRender(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
