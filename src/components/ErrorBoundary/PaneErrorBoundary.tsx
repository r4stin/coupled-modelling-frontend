'use client';

import { Button } from '@heroui/react';
import { Component, ReactNode } from 'react';

import ErrorAlert from '@/components/ErrorAlert/ErrorAlert';
import { reloadPage } from '@/lib/browser';

type Props = {
    /** Names the region in the fallback, e.g. "the header controls". */
    label: string;
    /** The region's selection; a change after a crash mounts the children afresh. */
    resetKey?: string | null;
    children: ReactNode;
};

// The crash's key is stamped during the capture render: commit-phase lifecycles would see it too late.
const PENDING = Symbol('pending');

type State = {
    caught: { error: unknown; key: Props['resetKey'] | typeof PENDING } | null;
};

/** Contains a render-time exception to one region of the explorer (class component: React's error-boundary contract). */
class PaneErrorBoundary extends Component<Props, State> {
    state: State = { caught: null };

    static getDerivedStateFromError(error: unknown): State {
        return { caught: { error, key: PENDING } };
    }

    static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
        if (!state.caught) {
            return null;
        }
        if (state.caught.key === PENDING) {
            return { caught: { error: state.caught.error, key: props.resetKey } };
        }
        return state.caught.key !== props.resetKey ? { caught: null } : null;
    }

    render() {
        const { caught } = this.state;
        const { label, children } = this.props;
        if (caught) {
            return (
                <ErrorAlert
                    className="m-2 max-w-xl"
                    title={`Something went wrong in ${label}`}
                    description={caught.error instanceof Error ? caught.error.message : String(caught.error)}
                    action={
                        <Button size="sm" variant="ghost" onPress={reloadPage}>
                            Reload
                        </Button>
                    }
                />
            );
        }
        return children;
    }
}

export default PaneErrorBoundary;
