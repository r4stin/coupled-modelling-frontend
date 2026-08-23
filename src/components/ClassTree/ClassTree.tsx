'use client';

import { Alert, EmptyState, Spinner } from '@heroui/react';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import ClassTreeNodeItem from '@/components/ClassTree/ClassTreeNodeItem';
import { buildClassTree, findPathsToClass } from '@/lib/classTree';
import { useSelectedClass } from '@/lib/useSelectedClass';
import { classesUrl, getClassHierarchyMetadata } from '@/services/backend/classes';

const ClassTree = () => {
    const { data, error, isLoading } = useSWR(classesUrl, getClassHierarchyMetadata);
    const [selectedClass, setSelectedClass] = useSelectedClass();
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

    const isExpanded = (path: string) => overrides.get(path) ?? autoExpanded.has(path);

    const toggleExpanded = (path: string) => setOverrides((current) => new Map(current).set(path, !isExpanded(path)));

    const selectClass = (name: string) => {
        setSelectedClass(name);
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

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center" role="status" aria-label="Loading classes">
                <Spinner size="sm" />
            </div>
        );
    }
    if (error && !data) {
        return (
            <Alert status="danger" className="m-2">
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Title>Could not load the class hierarchy</Alert.Title>
                    <Alert.Description>Check the backend connection, then refresh.</Alert.Description>
                </Alert.Content>
            </Alert>
        );
    }
    if (tree.length === 0) {
        return <EmptyState className="m-4">No classes found in the project namespace.</EmptyState>;
    }

    return (
        <ul className="p-2">
            {tree.map((node) => (
                <ClassTreeNodeItem
                    key={node.name}
                    node={node}
                    parentPath=""
                    isExpanded={isExpanded}
                    selectedClass={selectedClass}
                    onToggle={toggleExpanded}
                    onSelect={selectClass}
                />
            ))}
        </ul>
    );
};

export default ClassTree;
