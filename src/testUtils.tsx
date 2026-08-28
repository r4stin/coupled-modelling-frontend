import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { NuqsTestingAdapter, OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { ReactElement, ReactNode } from 'react';
import { SWRConfig } from 'swr';

import Providers from '@/components/Providers/Providers';

type CustomOptions = {
    /** Initial URL search params seen by nuqs hooks (e.g. '?class=solvers'). */
    searchParams?: string;
    /** Called with the new search params whenever a nuqs hook updates the URL. */
    onUrlUpdate?: OnUrlUpdateFunction;
};

/**
 * Renders with the app's real provider stack, an isolated SWR cache, and a nuqs
 * testing adapter. hasMemory reflects URL updates back into hook state, like a
 * real adapter — same-value guards in the selection hook read the current value.
 */
const customRender = (ui: ReactElement, { searchParams, onUrlUpdate, ...options }: Omit<RenderOptions, 'wrapper'> & CustomOptions = {}) => {
    const AllProviders = ({ children }: { children: ReactNode }) => (
        <NuqsTestingAdapter hasMemory searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
            <Providers>
                <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
            </Providers>
        </NuqsTestingAdapter>
    );
    return rtlRender(ui, { wrapper: AllProviders, ...options });
};

export * from '@testing-library/react';
export { customRender as render };
