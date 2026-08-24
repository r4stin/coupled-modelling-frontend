'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

import ClassTreeNodeItem from '@/components/ClassTree/ClassTreeNodeItem';
import PaneStateBoundary from '@/components/ExplorerShell/PaneStateBoundary';
import { buildClassTree, findPathsToClass } from '@/lib/classTree';
import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { classesUrl, getClassHierarchyMetadata } from '@/services/backend/classes';

const ClassTree = () => {
    const { data, error, isLoading } = useSWR(classesUrl, getClassHierarchyMetadata);
    const { selectedClass, selectClass } = useExplorerSelection();
    // Explicit user choices per node path; anything else falls back to auto-expansion.
    const [overrides, setOverrides] = useState<ReadonlyMap<string, boolean>>(new Map());

    const tree = useMemo(() => buildClassTree(data ?? []), [data]);

    // The selected class must be visible even when it arrives via the URL: every path
    // prefix leading to one of its occurrences is auto-expanded, including the node
    // itself so its subclasses show.
    const autoExpanded = useMemo(() => {
        if (!selectedClass) {
            return new Set<string>();
        }
        return new Set(findPathsToClass(tree, selectedClass).flatMap((path) => path.map((_, index) => path.slice(0, index + 1).join('/'))));
    }, [tree, selectedClass]);

    // When the selection changes from any surface (tree click, inspector link, URL),
    // drop manual collapses that would hide the newly selected class. Render-phase
    // state adjustment per React's derived-state pattern — no effect needed.
    const [prevSelected, setPrevSelected] = useState(selectedClass);
    if (selectedClass !== prevSelected) {
        setPrevSelected(selectedClass);
        setOverrides((current) => {
            const next = new Map([...current].filter(([path, expanded]) => expanded || !autoExpanded.has(path)));
            return next.size === current.size ? current : next;
        });
    }

    const isExpanded = (path: string) => overrides.get(path) ?? autoExpanded.has(path);

    const toggleExpanded = (path: string) => setOverrides((current) => new Map(current).set(path, !isExpanded(path)));

    const handleSelect = (name: string) => {
        selectClass(name);
        // Re-selecting a manually collapsed class should reveal its subclasses again.
        setOverrides((current) => {
            const next = new Map(current);
            for (const [path, expanded] of current) {
                if (!expanded && path.split('/').at(-1) === name) {
                    next.delete(path);
                }
            }
            return next;
        });
    };

    return (
        <PaneStateBoundary
            isLoading={isLoading}
            loadingLabel="Loading classes"
            hasError={Boolean(error) && !data}
            errorTitle="Could not load the class hierarchy"
            isEmpty={tree.length === 0}
            emptyMessage="No classes found in the project namespace."
        >
            <ul className="p-2">
                {tree.map((node) => (
                    <ClassTreeNodeItem
                        key={node.name}
                        node={node}
                        parentPath=""
                        isExpanded={isExpanded}
                        selectedClass={selectedClass}
                        onToggle={toggleExpanded}
                        onSelect={handleSelect}
                    />
                ))}
            </ul>
        </PaneStateBoundary>
    );
};

export default ClassTree;
