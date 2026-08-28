'use client';

import { cn, IconChevronRight } from '@heroui/react';
import { FC } from 'react';
import { Button, TreeItem, TreeItemContent } from 'react-aria-components';

import { childPath, ClassTreeNode } from '@/lib/classTree';
import { selectableRowClass } from '@/lib/styles';

type Props = {
    node: ClassTreeNode;
    /** Path of the parent occurrence ('' for roots); a multi-parent class keeps independent expansion state per occurrence. */
    parentPath: string;
    selectedClass: string | null;
    onPress: (name: string) => void;
};

const ClassTreeNodeItem: FC<Props> = ({ node, parentPath, selectedClass, onPress }) => {
    const path = childPath(parentPath, node.name);
    const hasChildren = node.children.length > 0;

    return (
        <TreeItem
            id={path}
            textValue={node.name}
            className={selectableRowClass(selectedClass === node.name, 'flex cursor-pointer items-center gap-1')}
            onPress={() => onPress(node.name)}
        >
            <TreeItemContent>
                {({ isExpanded, level }) => (
                    <>
                        {/* One guide segment per ancestor level; segments align across rows
                            into the continuous indent lines the nested layout drew. With the
                            row's gap-1, each level indents 21px, matching the old geometry. */}
                        {Array.from({ length: level - 1 }, (_, index) => (
                            <span key={index} aria-hidden className="ml-3 w-1.25 shrink-0 self-stretch border-l border-border" />
                        ))}
                        {hasChildren ? (
                            <Button
                                slot="chevron"
                                className="flex size-5 shrink-0 items-center justify-center rounded text-muted hover:text-foreground"
                            >
                                <IconChevronRight className={cn('size-3 transition-transform', isExpanded && 'rotate-90')} />
                            </Button>
                        ) : (
                            <span aria-hidden className="flex size-5 shrink-0 items-center justify-center text-muted">
                                ·
                            </span>
                        )}
                        <span className="min-w-0 flex-1 truncate py-1 text-left text-sm" title={node.name}>
                            {node.name}
                        </span>
                    </>
                )}
            </TreeItemContent>
            {node.children.map((child) => (
                <ClassTreeNodeItem key={child.name} node={child} parentPath={path} selectedClass={selectedClass} onPress={onPress} />
            ))}
        </TreeItem>
    );
};

export default ClassTreeNodeItem;
