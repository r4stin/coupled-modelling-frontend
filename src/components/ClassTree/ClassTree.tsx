'use client';

import { Key, Selection } from '@heroui/react';
import { useMemo, useState } from 'react';
import { Tree } from 'react-aria-components';

import ClassTreeNodeItem from '@/components/ClassTree/ClassTreeNodeItem';
import PaneStateBoundary from '@/components/ExplorerShell/PaneStateBoundary';
import { buildClassTree, classOfPath, findPathsToClass, pathKey, revealedPrefixes } from '@/lib/classTree';
import { useClassHierarchy } from '@/lib/useClassHierarchy';
import { useExplorerSelection } from '@/lib/useExplorerSelection';

const ClassTree = () => {
    const { data, error, isLoading } = useClassHierarchy();
    const { selectedClass, selectClass } = useExplorerSelection();
    // Explicit user choices per node path; anything else falls back to auto-expansion.
    const [overrides, setOverrides] = useState<ReadonlyMap<string, boolean>>(new Map());
    // The occurrence row the user last pressed; RAC marks it as the selected row.
    const [pressedPath, setPressedPath] = useState<string | null>(null);

    const tree = useMemo(() => buildClassTree(data ?? []), [data]);

    // Where the selected class occurs; feeds auto-expansion and the selected row.
    const occurrences = useMemo(() => (selectedClass ? findPathsToClass(tree, selectedClass) : []), [tree, selectedClass]);

    // The selected class must be visible even when it arrives via the URL: every path
    // prefix leading to one of its occurrences is auto-expanded, including the node
    // itself so its subclasses show.
    const autoExpanded = useMemo(() => revealedPrefixes(occurrences), [occurrences]);

    // Effective expansion is derived fresh every render — overrides win over
    // auto-expansion — so it holds from the first render with a warm cache and
    // survives hierarchy refreshes without re-opening manual collapses.
    const expanded = useMemo(() => {
        const keys = new Set<Key>();
        for (const path of autoExpanded) {
            if (overrides.get(path) !== false) {
                keys.add(path);
            }
        }
        for (const [path, isOpen] of overrides) {
            if (isOpen) {
                keys.add(path);
            }
        }
        return keys;
    }, [autoExpanded, overrides]);

    // When the selection changes from any surface (tree press, inspector link, URL),
    // drop manual collapses that would hide the newly selected class. Render-phase
    // state adjustment per React's derived-state pattern — no effect needed.
    const [prevSelected, setPrevSelected] = useState(selectedClass);
    if (selectedClass !== prevSelected) {
        setPrevSelected(selectedClass);
        setOverrides((current) => {
            const next = new Map([...current].filter(([path, isOpen]) => isOpen || !autoExpanded.has(path)));
            return next.size === current.size ? current : next;
        });
    }

    // RAC hands back the full expansion set; record the delta as explicit choices.
    const handleExpandedChange = (keys: Set<Key>) => {
        setOverrides((current) => {
            const next = new Map(current);
            for (const path of keys) {
                if (!expanded.has(path)) {
                    next.set(String(path), true);
                }
            }
            for (const path of expanded) {
                if (!keys.has(path)) {
                    next.set(String(path), false);
                }
            }
            return next;
        });
    };

    // Keep the occurrence the user pressed while it exists and still matches the
    // selected class; otherwise fall back to the first occurrence.
    const pressedOccurrence = pressedPath !== null && occurrences.some((trail) => pathKey(trail) === pressedPath) ? pressedPath : undefined;
    const selectedPath = pressedOccurrence ?? (occurrences[0] && pathKey(occurrences[0]));

    const handleSelectionChange = (keys: Selection) => {
        const path = keys === 'all' ? undefined : [...keys][0];
        if (typeof path !== 'string') {
            return;
        }
        setPressedPath(path);
        selectClass(classOfPath(path));
    };

    // Re-pressing a row (even the already-selected one) reveals its collapsed subclasses.
    const handlePress = (name: string) => {
        setOverrides((current) => {
            const next = new Map(current);
            for (const [path, isOpen] of current) {
                if (!isOpen && classOfPath(path) === name) {
                    next.delete(path);
                }
            }
            return next.size === current.size ? current : next;
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
            <Tree
                aria-label="Class hierarchy"
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={selectedPath ? [selectedPath] : []}
                onSelectionChange={handleSelectionChange}
                expandedKeys={expanded}
                onExpandedChange={handleExpandedChange}
                className="p-2 outline-none"
            >
                {tree.map((node) => (
                    <ClassTreeNodeItem key={node.name} node={node} parentPath="" selectedClass={selectedClass} onPress={handlePress} />
                ))}
            </Tree>
        </PaneStateBoundary>
    );
};

export default ClassTree;
