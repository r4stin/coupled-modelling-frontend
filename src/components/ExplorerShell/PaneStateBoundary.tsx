'use client';

import { Alert, EmptyState, Spinner } from '@heroui/react';
import { FC, ReactNode } from 'react';

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
            <div className="flex h-full items-center justify-center" role="status" aria-label={loadingLabel}>
                <Spinner size="sm" />
            </div>
        );
    }
    if (hasError) {
        return (
            <Alert status="danger" className="m-2">
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Title>{errorTitle}</Alert.Title>
                    <Alert.Description>Check the backend connection, then refresh.</Alert.Description>
                </Alert.Content>
            </Alert>
        );
    }
    if (isEmpty) {
        return <EmptyState className="m-4">{emptyMessage}</EmptyState>;
    }
    return children;
};

export default PaneStateBoundary;
