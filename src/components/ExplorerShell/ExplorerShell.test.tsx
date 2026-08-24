import { describe, expect, it, vi } from 'vitest';

import ExplorerShell from '@/components/ExplorerShell/ExplorerShell';
import { getClassHierarchyMetadata, getClassInstanceSummaries, getClassMetadata } from '@/services/backend/classes';
import { render, screen, within } from '@/testUtils';

vi.mock('@/services/backend/classes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/classes')>()),
    getClassHierarchyMetadata: vi.fn(),
    getClassInstanceSummaries: vi.fn(),
    getClassMetadata: vi.fn(),
}));

const mockHierarchy = vi.mocked(getClassHierarchyMetadata);
const mockSummaries = vi.mocked(getClassInstanceSummaries);
const mockMetadata = vi.mocked(getClassMetadata);

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

    it('shows the class inspector and instance list for the class selected in the URL', async () => {
        mockHierarchy.mockResolvedValue([{ class: 'solvers', parents: [] }]);
        mockSummaries.mockResolvedValue([]);
        mockMetadata.mockResolvedValue({
            id: 'solvers',
            label: 'solvers',
            descriptions: ['Solver classes.'],
            superclasses: [],
            subclasses: [],
            restrictions: [],
            equivalent_classes: [],
        });
        render(<ExplorerShell />, { searchParams: '?class=solvers' });
        expect(screen.getByRole('heading', { name: 'Instances · solvers' })).toBeInTheDocument();
        expect(await screen.findByText('No instances found for this class.')).toBeInTheDocument();
        expect(await screen.findByText('Solver classes.')).toBeInTheDocument();
        // Scoped to the tree pane: the inspector renders class-nav buttons with the same names.
        await within(screen.getByRole('region', { name: 'Class Hierarchy' })).findByRole('button', { name: 'solvers' });
    });
});
