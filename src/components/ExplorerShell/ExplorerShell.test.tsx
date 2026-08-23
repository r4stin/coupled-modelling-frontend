import { describe, expect, it, vi } from 'vitest';

import ExplorerShell from '@/components/ExplorerShell/ExplorerShell';
import { getClassHierarchyMetadata } from '@/services/backend/classes';
import { render, screen } from '@/testUtils';

vi.mock('@/services/backend/classes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/classes')>()),
    getClassHierarchyMetadata: vi.fn(),
}));

const mockHierarchy = vi.mocked(getClassHierarchyMetadata);

describe('ExplorerShell', () => {
    it('renders the three explorer panes', async () => {
        mockHierarchy.mockResolvedValue([]);
        render(<ExplorerShell />);
        expect(screen.getByRole('heading', { name: 'Class Hierarchy' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Instances' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Instance Inspector' })).toBeInTheDocument();
        expect(await screen.findByText('No classes found in the project namespace.')).toBeInTheDocument();
    });

    it('shows placeholder guidance while nothing is selected', async () => {
        mockHierarchy.mockResolvedValue([]);
        render(<ExplorerShell />);
        expect(screen.getByText('Select a class to list its instances.')).toBeInTheDocument();
        expect(screen.getByText('Select an instance to view its properties.')).toBeInTheDocument();
        await screen.findByText('No classes found in the project namespace.');
    });

    it('reflects the class selected in the URL in the Instances pane', async () => {
        mockHierarchy.mockResolvedValue([{ class: 'solvers', parents: [] }]);
        render(<ExplorerShell />, { searchParams: '?class=solvers' });
        expect(screen.getByRole('heading', { name: 'Instances · solvers' })).toBeInTheDocument();
        expect(screen.getByText('Instances of “solvers” will be listed here.')).toBeInTheDocument();
        await screen.findByRole('button', { name: 'solvers' });
    });
});
