'use client';

import { EmptyState, Spinner } from '@heroui/react';
import { FC, ReactNode } from 'react';

import ErrorAlert from '@/components/ErrorAlert/ErrorAlert';

type Props = {
    isLoading: boolean;
    loadingLabel: string;
    /** Show the error state — pass `error && !data` to keep stale data visible through transient failures. */
    hasError: boolean;
    errorTitle: string;
    isEmpty: boolean;
    emptyMessage: string;
    children: ReactNode;
};

/** Shared loading / error / empty scaffolding for the explorer panes. */
const PaneStateBoundary: FC<Props> = ({ isLoading, loadingLabel, hasError, errorTitle, isEmpty, emptyMessage, children }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10" role="status" aria-label={loadingLabel}>
                <Spinner size="sm" />
            </div>
        );
    }
    if (hasError) {
        return <ErrorAlert role="status" className="m-2" title={errorTitle} description="Check the backend connection, then refresh." />;
    }
    if (isEmpty) {
        return <EmptyState className="m-4">{emptyMessage}</EmptyState>;
    }
    return children;
};

export default PaneStateBoundary;
