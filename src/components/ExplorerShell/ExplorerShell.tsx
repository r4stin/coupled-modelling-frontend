'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import ClassTree from '@/components/ClassTree/ClassTree';
import ExplorerPane from '@/components/ExplorerShell/ExplorerPane';
import { useSelectedClass } from '@/lib/useSelectedClass';

const PaneResizeHandle = () => (
    <PanelResizeHandle className="w-1 shrink-0 bg-border transition-colors data-[resize-handle-state=drag]:bg-accent data-[resize-handle-state=hover]:bg-accent" />
);

const PanePlaceholder = ({ children }: { children: string }) => (
    <div className="flex h-full items-center justify-center p-4">
        <p className="max-w-56 text-center text-sm text-muted">{children}</p>
    </div>
);

const ExplorerShell = () => {
    const [selectedClass] = useSelectedClass();
    const instancesTitle = selectedClass ? `Instances · ${selectedClass}` : 'Instances';
    const instancesHint = selectedClass ? `Instances of “${selectedClass}” will be listed here.` : 'Select a class to list its instances.';

    return (
        <PanelGroup direction="horizontal" autoSaveId="cm-explorer-panes" className="min-h-0 flex-1">
            <Panel defaultSize={22} minSize={14}>
                <ExplorerPane title="Class Hierarchy">
                    <ClassTree />
                </ExplorerPane>
            </Panel>
            <PaneResizeHandle />
            <Panel defaultSize={38} minSize={20}>
                <ExplorerPane title={instancesTitle}>
                    <PanePlaceholder>{instancesHint}</PanePlaceholder>
                </ExplorerPane>
            </Panel>
            <PaneResizeHandle />
            <Panel defaultSize={40} minSize={20}>
                <ExplorerPane title="Instance Inspector">
                    <PanePlaceholder>Select an instance to view its properties.</PanePlaceholder>
                </ExplorerPane>
            </Panel>
        </PanelGroup>
    );
};

export default ExplorerShell;
