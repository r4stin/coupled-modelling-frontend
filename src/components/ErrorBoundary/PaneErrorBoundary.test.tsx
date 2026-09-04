import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PaneErrorBoundary from '@/components/ErrorBoundary/PaneErrorBoundary';
import { reloadPage } from '@/lib/browser';
import { render, screen } from '@/testUtils';

vi.mock('@/lib/browser', () => ({ reloadPage: vi.fn() }));

const Exploding = ({ reason = new Error('render exploded') }: { reason?: unknown }): never => {
    throw reason;
};

describe('PaneErrorBoundary', () => {
    beforeEach(() => {
        // React reports the caught error on the console; keep the test output clean.
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders its children while nothing throws', () => {
        render(
            <PaneErrorBoundary label="the class hierarchy">
                <p>fine</p>
            </PaneErrorBoundary>,
        );
        expect(screen.getByText('fine')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('contains a render error to its region and offers a page reload', async () => {
        render(
            <>
                <PaneErrorBoundary label="the class hierarchy">
                    <Exploding />
                </PaneErrorBoundary>
                <p>sibling survives</p>
            </>,
        );
        expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong in the class hierarchy');
        expect(screen.getByText('render exploded')).toBeInTheDocument();
        expect(screen.getByText('sibling survives')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
        expect(reloadPage).toHaveBeenCalledTimes(1);
    });

    it('describes a thrown non-Error value instead of blanking the description', () => {
        render(
            <PaneErrorBoundary label="the class hierarchy">
                <Exploding reason="plain string" />
            </PaneErrorBoundary>,
        );
        expect(screen.getByRole('alert')).toHaveTextContent('plain string');
    });

    it('contains a crash on an update under the same key and reports it once', () => {
        const { rerender } = render(
            <PaneErrorBoundary label="the instance inspector" resetKey="instance_1">
                <p>fine so far</p>
            </PaneErrorBoundary>,
        );
        rerender(
            <PaneErrorBoundary label="the instance inspector" resetKey="instance_1">
                <Exploding />
            </PaneErrorBoundary>,
        );
        expect(screen.getByRole('alert')).toHaveTextContent('render exploded');
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('drops the error when its reset key changes', () => {
        const { rerender } = render(
            <PaneErrorBoundary label="the instance inspector" resetKey="instance_1">
                <Exploding />
            </PaneErrorBoundary>,
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();
        rerender(
            <PaneErrorBoundary label="the instance inspector" resetKey="instance_2">
                <p>recovered</p>
            </PaneErrorBoundary>,
        );
        expect(screen.getByText('recovered')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
