'use client';

import { SearchField } from '@heroui/react';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import PaneStateBoundary from '@/components/ExplorerShell/PaneStateBoundary';
import InstanceListItem from '@/components/InstanceList/InstanceListItem';
import { filterInstances, groupInstancesByType } from '@/lib/instanceGroups';
import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { classInstanceSummariesUrl, getClassInstanceSummaries } from '@/services/backend/classes';

type Props = {
    /** Ontology class whose instances are listed. */
    classId: string;
};

const InstanceList = ({ classId }: Props) => {
    const { data, error, isLoading } = useSWR([classInstanceSummariesUrl, classId], () => getClassInstanceSummaries(classId));
    const { selectedInstance, selectInstance } = useExplorerSelection();
    const [query, setQuery] = useState('');

    // The list re-renders on every selection change; skip regrouping when inputs are unchanged.
    const groups = useMemo(() => groupInstancesByType(filterInstances(data ?? [], query, classId), classId), [data, query, classId]);

    return (
        <PaneStateBoundary
            isLoading={isLoading}
            loadingLabel="Loading instances"
            hasError={Boolean(error) && !data}
            errorTitle="Could not load the instances"
            isEmpty={(data ?? []).length === 0}
            emptyMessage="No instances found for this class."
        >
            <div className="space-y-2">
                <SearchField aria-label="Filter instances" value={query} onChange={setQuery} fullWidth>
                    <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Filter instances…" />
                        <SearchField.ClearButton />
                    </SearchField.Group>
                </SearchField>
                {groups.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted">No instances match the filter.</p>
                ) : (
                    <div>
                        {groups.map((group) => (
                            <section key={group.type} aria-label={group.type}>
                                <h3 className="sticky top-0 bg-background px-2 py-1 text-xs font-semibold tracking-wide text-muted uppercase">
                                    {group.type}
                                </h3>
                                <ul className="mb-2">
                                    {group.instances.map((instance) => (
                                        <InstanceListItem
                                            key={instance.id}
                                            instance={instance}
                                            isSelected={selectedInstance === instance.id}
                                            onSelect={selectInstance}
                                        />
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </PaneStateBoundary>
    );
};

export default InstanceList;
