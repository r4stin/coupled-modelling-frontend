import { describe, expect, it } from 'vitest';

import ExplorerShell from '@/components/ExplorerShell/ExplorerShell';
import { render, screen } from '@/testUtils';

describe('ExplorerShell', () => {
    it('renders the three explorer panes', () => {
        render(<ExplorerShell />);
        expect(screen.getByRole('heading', { name: 'Class Hierarchy' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Instances' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Instance Inspector' })).toBeInTheDocument();
    });

    it('shows placeholder guidance in the instance panes', () => {
        render(<ExplorerShell />);
        expect(screen.getByText('Select a class to list its instances.')).toBeInTheDocument();
        expect(screen.getByText('Select an instance to view its properties.')).toBeInTheDocument();
    });
});
