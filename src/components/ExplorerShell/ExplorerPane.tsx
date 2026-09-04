import { FC, ReactNode } from 'react';

import PaneErrorBoundary from '@/components/ErrorBoundary/PaneErrorBoundary';

type Props = {
    title: string;
    /** Extra controls rendered on the right side of the pane header. */
    actions?: ReactNode;
    /** The pane's selection; a change replaces a crashed body with a fresh one. */
    resetKey?: string | null;
    children: ReactNode;
};

const ExplorerPane: FC<Props> = ({ title, actions, resetKey, children }) => (
    <section aria-label={title} className="flex h-full min-w-0 flex-col bg-background">
        <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-background-secondary px-3">
            <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
            {actions}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <PaneErrorBoundary label={`the ${title} pane`} resetKey={resetKey}>
                {children}
            </PaneErrorBoundary>
        </div>
    </section>
);

export default ExplorerPane;
