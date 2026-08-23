'use client';

import { cn, IconChevronRight } from '@heroui/react';
import { FC } from 'react';

import { ClassTreeNode } from '@/lib/classTree';

type Props = {
    node: ClassTreeNode;
    /** Path of the parent occurrence ('' for roots); a multi-parent class keeps independent expansion state per occurrence. */
    parentPath: string;
    isExpanded: (path: string) => boolean;
    selectedClass: string | null;
    onToggle: (path: string) => void;
    onSelect: (name: string) => void;
};

const ClassTreeNodeItem: FC<Props> = ({ node, parentPath, isExpanded, selectedClass, onToggle, onSelect }) => {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name;
    const hasChildren = node.children.length > 0;
    const expanded = isExpanded(path);
    const isSelected = selectedClass === node.name;

    return (
        <li>
            <div
                className={cn(
                    'flex items-center gap-1 rounded-md',
                    isSelected ? 'bg-accent-soft text-accent-soft-foreground' : 'hover:bg-default-soft',
                )}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.name}`}
                        aria-expanded={expanded}
                        className="flex size-5 shrink-0 items-center justify-center rounded text-muted hover:text-foreground"
                        onClick={() => onToggle(path)}
                    >
                        <IconChevronRight className={cn('size-3 transition-transform', expanded && 'rotate-90')} />
                    </button>
                ) : (
                    <span aria-hidden className="flex size-5 shrink-0 items-center justify-center text-muted">
                        ·
                    </span>
                )}
                <button
                    type="button"
                    aria-current={isSelected || undefined}
                    className="min-w-0 flex-1 truncate py-1 text-left text-sm"
                    onClick={() => onSelect(node.name)}
                    title={node.name}
                >
                    {node.name}
                </button>
            </div>
            {hasChildren && expanded && (
                <ul className="ml-4 border-l border-border pl-1">
                    {node.children.map((child) => (
                        <ClassTreeNodeItem
                            key={child.name}
                            node={child}
                            parentPath={path}
                            isExpanded={isExpanded}
                            selectedClass={selectedClass}
                            onToggle={onToggle}
                            onSelect={onSelect}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default ClassTreeNodeItem;
