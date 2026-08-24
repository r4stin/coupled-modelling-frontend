'use client';

import { Chip } from '@heroui/react';
import { HTTPError } from 'ky';
import { useEffect } from 'react';
import useSWR from 'swr';

import PaneStateBoundary from '@/components/ExplorerShell/PaneStateBoundary';
import PropertyValue from '@/components/InstanceInspector/PropertyValue';
import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { getInstancePropertyMetadata, instancesUrl } from '@/services/backend/instances';

type Props = {
    /** Identifier of the instance to inspect. */
    instanceId: string;
};

/** The backend answers 400 for an unknown instance id (e.g. deleted, or a stale URL). */
const isNotFound = (error: unknown) => error instanceof HTTPError && (error.response.status === 400 || error.response.status === 404);

/** Read-only instance details: label, id, types, and all direct properties with navigable object links. */
const InstanceInspector = ({ instanceId }: Props) => {
    const { data, error, isLoading } = useSWR([instancesUrl, instanceId], () => getInstancePropertyMetadata(instanceId));
    const { selectedClass, selectInstance, alignClassWithInstanceTypes } = useExplorerSelection();

    // Inspector-link navigation can land on an instance of another class; once its types are
    // known, re-target the class so all three panes stay consistent. The URL is an external
    // store shared with the other panes, so this sync belongs in an effect, not in render.
    useEffect(() => {
        if (data && data.id === instanceId && selectedClass && !data.types.includes(selectedClass)) {
            alignClassWithInstanceTypes(data.types);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- align* is recreated per render; data/class identify the sync
    }, [data, instanceId, selectedClass]);

    // A definitive not-found (deleted instance, stale URL) wins over any cached data.
    const notFound = isNotFound(error);

    return (
        <PaneStateBoundary
            isLoading={isLoading}
            loadingLabel="Loading instance details"
            hasError={Boolean(error) && !data && !notFound}
            errorTitle="Could not load the instance details"
            isEmpty={notFound}
            emptyMessage="This instance no longer exists in the knowledge base."
        >
            {data && (
                <div className="space-y-3">
                    <div className="space-y-1 rounded-lg border border-border bg-background-secondary p-3">
                        <h3 className="text-sm font-bold break-all">{data.label}</h3>
                        <div className="text-xs text-muted">ID: {data.id}</div>
                        {data.types.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {data.types.map((type) => (
                                    <Chip key={type} color="accent" size="sm" variant="soft">
                                        {type}
                                    </Chip>
                                ))}
                            </div>
                        )}
                    </div>
                    {data.properties.length === 0 ? (
                        <p className="text-sm text-muted">This instance has no properties defined.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs text-muted uppercase">
                                    <th scope="col" className="py-1 pr-2 font-semibold">
                                        Property
                                    </th>
                                    <th scope="col" className="py-1 font-semibold">
                                        Values
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.properties.map((group) => (
                                    <tr key={group.property} className="border-b border-border align-top">
                                        <td className="py-1.5 pr-2 font-medium break-all">{group.property}</td>
                                        <td className="py-1.5">
                                            <div className="space-y-1">
                                                {group.values.map((value, index) => (
                                                    <div key={index}>
                                                        <PropertyValue value={value} onNavigate={selectInstance} />
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </PaneStateBoundary>
    );
};

export default InstanceInspector;
