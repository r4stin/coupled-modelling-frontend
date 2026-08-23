import { FC } from 'react';

import HealthBadge from '@/components/Layout/HealthBadge';
import ThemeToggle from '@/components/Layout/ThemeToggle';
import { APP_DESCRIPTION, APP_TITLE } from '@/constants/app';

const Header: FC = () => (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-background-secondary px-4">
        <h1 className="shrink-0 text-base font-bold text-foreground">{APP_TITLE}</h1>
        <p className="hidden min-w-0 truncate text-xs text-muted lg:block">{APP_DESCRIPTION}</p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
            <HealthBadge />
            <ThemeToggle />
        </div>
    </header>
);

export default Header;
