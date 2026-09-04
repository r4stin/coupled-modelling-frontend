import { FC } from 'react';

import PaneErrorBoundary from '@/components/ErrorBoundary/PaneErrorBoundary';
import DownloadOwl from '@/components/Layout/DownloadOwl';
import HeaderSearch from '@/components/Layout/HeaderSearch';
import HealthIndicator from '@/components/Layout/HealthIndicator';
import ImportKratos from '@/components/Layout/ImportKratos';
import ThemeToggle from '@/components/Layout/ThemeToggle';
import { APP_DESCRIPTION, APP_TITLE } from '@/constants/app';

const Header: FC = () => (
    <header className="flex min-h-12 shrink-0 items-center gap-4 border-b border-border bg-background-secondary px-4">
        <h1 className="shrink-0 text-base font-bold text-foreground">{APP_TITLE}</h1>
        <p className="hidden min-w-0 truncate text-xs text-muted lg:block">{APP_DESCRIPTION}</p>
        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">
            {/* Only the interactive controls can throw; the banner landmark and the title stay up. */}
            <PaneErrorBoundary label="the header controls">
                <HeaderSearch />
                <ImportKratos />
                <DownloadOwl />
                <HealthIndicator />
                <ThemeToggle />
            </PaneErrorBoundary>
        </div>
    </header>
);

export default Header;
