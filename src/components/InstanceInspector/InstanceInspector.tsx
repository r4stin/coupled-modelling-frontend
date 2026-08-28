'use client';

import { Button, Chip, toast } from '@heroui/react';
import { HTTPError } from 'ky';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import PaneStateBoundary from '@/components/ExplorerShell/PaneStateBoundary';
import Icon from '@/components/Icons/Icon';
import AddChildDialog from '@/components/InstanceInspector/AddChildDialog';
import AddValueForm from '@/components/InstanceInspector/AddValueForm';
import EditableLiteralValue from '@/components/InstanceInspector/EditableLiteralValue';
import ExportKratosButton from '@/components/InstanceInspector/ExportKratosButton';
import PropertyValue from '@/components/InstanceInspector/PropertyValue';
import { getApiErrorMessage } from '@/lib/apiError';
import { toDeleteTarget } from '@/lib/deleteTargets';
import { hasDistinctLabel } from '@/lib/styles';
import { useExplorerRefresh } from '@/lib/useExplorerRefresh';
import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { instanceDisplayName, valueDisplayLabel } from '@/lib/valueDisplay';
import { deleteInstance, deleteValue, getInstancePropertyMetadata, instancesUrl } from '@/services/backend/instances';
import { InstancePropertyGroup } from '@/types/backend';

type Props = {
    /** Identifier of the instance to inspect. */
    instanceId: string;
};

type PropertyValueItem = InstancePropertyGroup['values'][number];

type PendingDelete = ({ type: 'value'; property: string; value: PropertyValueItem } | { type: 'instance' }) & { deleting: boolean };

/** The backend answers 400 for an unknown instance id (e.g. deleted, or a stale URL). */
const isNotFound = (error: unknown) => error instanceof HTTPError && (error.response.status === 400 || error.response.status === 404);

/** Instance details: label, id, types, and all direct properties with navigable object links and per-value deletion. */
const InstanceInspector = ({ instanceId }: Props) => {
    const { data, error, isLoading } = useSWR([instancesUrl, instanceId], () => getInstancePropertyMetadata(instanceId));
    const { selectedClass, selectInstance, alignClassWithInstanceTypes, clearRemovedInstance } = useExplorerSelection();
    const { refreshInstance, purgeInstance, refreshClassInstances } = useExplorerRefresh();
    const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
    // Row currently in inline-edit mode; its delete affordance is hidden meanwhile.
    const [editingKeys, setEditingKeys] = useState<ReadonlySet<string>>(new Set());
    const [isAddChildOpen, setIsAddChildOpen] = useState(false);

    // Navigation can land on an instance of another class (inspector links) or with no
    // class at all (an import, a pasted ?instance= URL); once the types are known,
    // re-target the class so all three panes stay consistent. The URL is an external
    // store shared with the other panes, so this sync belongs in an effect, not in render.
    useEffect(() => {
        if (data && data.id === instanceId && (!selectedClass || !data.types.includes(selectedClass))) {
            alignClassWithInstanceTypes(data.types);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- align* is recreated per render; data/class identify the sync
    }, [data, instanceId, selectedClass]);

    // A definitive not-found (deleted instance, stale URL) wins over any cached data.
    const notFound = isNotFound(error);

    const instanceDisplay =
        data && hasDistinctLabel(data.label, data.id) ? `"${data.label}" (${data.id})` : `"${data ? instanceDisplayName(data) : instanceId}"`;

    // Adding a value on an object property (or creating a child) can mint a new
    // instance of that property's class, so callers pass the property/class name
    // as an extra list to refresh.
    const refreshAfterMutation = (extraClasses: string[] = []) => {
        refreshClassInstances([...(data?.types ?? []), ...(selectedClass ? [selectedClass] : []), ...extraClasses]).catch(() => undefined);
        return refreshInstance(instanceId).catch(() => undefined);
    };

    const dialogContent =
        pendingDelete === null
            ? { title: '', message: '' }
            : pendingDelete.type === 'instance'
              ? {
                    title: 'Delete instance',
                    message: `Are you sure you want to permanently delete instance ${instanceDisplay} from the knowledge base?`,
                }
              : {
                    title: 'Delete value',
                    message: `Are you sure you want to delete ${pendingDelete.property} "${valueDisplayLabel(pendingDelete.value)}"?`,
                };

    const confirmDelete = async () => {
        if (!pendingDelete) {
            return;
        }
        setPendingDelete({ ...pendingDelete, deleting: true });
        const affectedClasses = [...(data?.types ?? []), ...(selectedClass ? [selectedClass] : [])];
        try {
            if (pendingDelete.type === 'value') {
                await deleteValue(instanceId, pendingDelete.property, toDeleteTarget(pendingDelete.value));
                toast.success(`Deleted ${pendingDelete.property} "${valueDisplayLabel(pendingDelete.value)}"`);
                await refreshInstance(instanceId);
            } else {
                await deleteInstance(instanceId);
                toast.success(`Instance ${instanceDisplay} deleted`);
                purgeInstance(instanceId);
                clearRemovedInstance();
            }
            refreshClassInstances(affectedClasses).catch(() => undefined);
            setPendingDelete(null);
        } catch (deleteError) {
            toast.danger(await getApiErrorMessage(deleteError, 'Delete failed'));
            setPendingDelete((current) => (current ? { ...current, deleting: false } : null));
        }
    };

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
                        {/* The full title always stays readable by wrapping at word boundaries; at
                            narrow pane widths the actions wrap below it (and among themselves)
                            instead of crushing it into a one-character column. */}
                        <div className="flex flex-wrap items-start gap-2">
                            <h3 className="min-w-0 grow basis-40 text-sm font-bold wrap-break-word">{instanceDisplayName(data)}</h3>
                            <div className="ml-auto flex flex-wrap justify-end gap-1.5">
                                <ExportKratosButton instanceId={instanceId} types={data.types} />
                                <Button size="sm" variant="primary" onPress={() => setIsAddChildOpen(true)}>
                                    Add child
                                </Button>
                                <Button size="sm" variant="danger-soft" onPress={() => setPendingDelete({ type: 'instance', deleting: false })}>
                                    Delete instance
                                </Button>
                            </div>
                        </div>
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
                        // table-fixed: long previews truncate instead of widening the column.
                        <table className="w-full table-fixed text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs text-muted uppercase">
                                    <th scope="col" className="w-1/3 py-1 pr-2 font-semibold">
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
                                                {group.values.map((value, index) => {
                                                    // Identity-based key (index only breaks ties between equal values):
                                                    // adds/deletes elsewhere in the group must not re-home an open
                                                    // inline editor onto a different value.
                                                    const valueKey = `${group.property}:${JSON.stringify(toDeleteTarget(value))}:${index}`;
                                                    return (
                                                        <div key={valueKey} className="flex items-start justify-between gap-2">
                                                            {value.kind === 'literal' ? (
                                                                <EditableLiteralValue
                                                                    instanceId={instanceId}
                                                                    property={group.property}
                                                                    value={value}
                                                                    onSaved={refreshAfterMutation}
                                                                    onEditingChange={(editing) =>
                                                                        // Several editors can be open at once; track them all
                                                                        // so every editing row hides its delete affordance.
                                                                        setEditingKeys((current) => {
                                                                            const next = new Set(current);
                                                                            if (editing) {
                                                                                next.add(valueKey);
                                                                            } else {
                                                                                next.delete(valueKey);
                                                                            }
                                                                            return next;
                                                                        })
                                                                    }
                                                                />
                                                            ) : (
                                                                <PropertyValue value={value} onNavigate={selectInstance} />
                                                            )}
                                                            {!editingKeys.has(valueKey) && (
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Delete ${group.property} value ${valueDisplayLabel(value)}`}
                                                                    title="Delete this value"
                                                                    className="-my-1 flex size-7 shrink-0 items-center justify-center rounded text-muted hover:bg-danger-soft hover:text-danger"
                                                                    onClick={() =>
                                                                        setPendingDelete({
                                                                            type: 'value',
                                                                            property: group.property,
                                                                            value,
                                                                            deleting: false,
                                                                        })
                                                                    }
                                                                >
                                                                    <Icon className="size-5">
                                                                        <path
                                                                            d="M3 6h18M8 6V4h8v2m1 0-1 14H8L7 6m3 4v7m4-7v7"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        />
                                                                    </Icon>
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <AddValueForm instanceId={instanceId} onAdded={(property) => refreshAfterMutation([property])} />
                    <AddChildDialog
                        isOpen={isAddChildOpen}
                        parentId={instanceId}
                        onCreated={(childClass) => refreshAfterMutation([childClass])}
                        onClose={() => setIsAddChildOpen(false)}
                    />
                    <ConfirmDialog
                        isOpen={pendingDelete !== null}
                        title={dialogContent.title}
                        message={dialogContent.message}
                        isPending={pendingDelete?.deleting ?? false}
                        onConfirm={confirmDelete}
                        onCancel={() => setPendingDelete(null)}
                    />
                </div>
            )}
        </PaneStateBoundary>
    );
};

export default InstanceInspector;
