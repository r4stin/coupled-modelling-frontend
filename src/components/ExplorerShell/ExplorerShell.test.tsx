import { afterEach, describe, expect, it, vi } from 'vitest';

import ExplorerShell from '@/components/ExplorerShell/ExplorerShell';
import { getClassHierarchyMetadata, getClassInstanceSummaries, getClassMetadata } from '@/services/backend/classes';
import { render, screen, within } from '@/testUtils';

vi.mock('@/services/backend/classes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/classes')>()),
    getClassHierarchyMetadata: vi.fn(),
    getClassInstanceSummaries: vi.fn(),
    getClassMetadata: vi.fn(),
}));

// Stands in for pane content that throws while rendering, for one sentinel instance only.
vi.mock('@/components/InstanceInspector/InstanceInspector', () => ({
    default: ({ instanceId }: { instanceId: string }) => {
        if (instanceId === 'instance_boom') {
            throw new Error('inspector exploded');
        }
        return <p>inspector {instanceId}</p>;
    },
}));

const mockHierarchy = vi.mocked(getClassHierarchyMetadata);
const mockSummaries = vi.mocked(getClassInstanceSummaries);
const mockMetadata = vi.mocked(getClassMetadata);

const solversMetadata = {
    id: 'solvers',
    label: 'solvers',
    descriptions: [],
    superclasses: [],
    subclasses: [],
    restrictions: [],
    equivalent_classes: [],
};

describe('ExplorerShell', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

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
        mockMetadata.mockResolvedValue({ ...solversMetadata, descriptions: ['Solver classes.'] });
        render(<ExplorerShell />, { searchParams: '?class=solvers' });
        expect(screen.getByRole('heading', { name: 'Instances · solvers' })).toBeInTheDocument();
        expect(await screen.findByText('No instances found for this class.')).toBeInTheDocument();
        expect(await screen.findByText('Solver classes.')).toBeInTheDocument();
        // Scoped to the tree pane: the inspector renders class-nav buttons with the same names.
        await within(screen.getByRole('region', { name: 'Class Hierarchy' })).findByRole('row', { name: 'solvers' });
    });

    it('contains a pane that throws while rendering and keeps the other panes working', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        mockHierarchy.mockResolvedValue([{ class: 'solvers', parents: [] }]);
        mockSummaries.mockResolvedValue([]);
        mockMetadata.mockResolvedValue(solversMetadata);
        render(<ExplorerShell />, { searchParams: '?class=solvers&instance=instance_boom' });
        const inspector = screen.getByRole('region', { name: 'Instance Inspector' });
        expect(within(inspector).getByRole('alert')).toHaveTextContent('Something went wrong in the Instance Inspector pane');
        expect(within(inspector).getByRole('button', { name: 'Reload' })).toBeInTheDocument();
        expect(await screen.findByText('No instances found for this class.')).toBeInTheDocument();
        await within(screen.getByRole('region', { name: 'Class Hierarchy' })).findByRole('row', { name: 'solvers' });
    });
});
