import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ClassInspector from '@/components/ClassInspector/ClassInspector';
import { getClassMetadata } from '@/services/backend/classes';
import { render, screen } from '@/testUtils';
import { ClassMetadata } from '@/types/backend';

vi.mock('@/services/backend/classes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/classes')>()),
    getClassMetadata: vi.fn(),
}));

const mockMetadata = vi.mocked(getClassMetadata);

const emptyMetadata: ClassMetadata = {
    id: 'solvers',
    label: 'solvers',
    descriptions: [],
    superclasses: [],
    subclasses: [],
    restrictions: [],
    equivalent_classes: [],
};

describe('ClassInspector', () => {
    it('renders descriptions, related classes, and restriction axioms', async () => {
        mockMetadata.mockResolvedValue({
            ...emptyMetadata,
            id: 'fluid_solver',
            label: 'fluid_solver',
            descriptions: ['Fluid dynamics solver class.'],
            superclasses: [{ id: 'solvers', label: 'solvers' }],
            subclasses: [{ id: 'low_fid_fluid', label: 'low_fid_fluid' }],
            restrictions: [
                {
                    property: { id: 'has_data', label: 'has_data' },
                    kind: 'some_values_from',
                    target_kind: 'class',
                    target: { id: 'data_1', label: 'data_1' },
                },
                {
                    property: { id: 'has_io_settings', label: 'has_io_settings' },
                    kind: 'qualified_cardinality',
                    cardinality: 1,
                    target_kind: 'class',
                    target: { id: 'io_settings_1', label: 'io_settings_1' },
                },
                {
                    property: { id: 'has_type', label: 'has_type' },
                    kind: 'has_value',
                    target_kind: 'literal',
                    target: { id: 'gauss_seidel', label: 'gauss_seidel', value: 'gauss_seidel' },
                },
            ],
        });
        render(<ClassInspector classId="fluid_solver" />);
        expect(await screen.findByText('Fluid dynamics solver class.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'solvers' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'low_fid_fluid' })).toBeInTheDocument();
        expect(screen.getByText('has_data')).toBeInTheDocument();
        expect(screen.getByText('some')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'data_1' })).toBeInTheDocument();
        expect(screen.getByText('exactly')).toBeInTheDocument();
        // Literal targets are plain text, not navigation links.
        expect(screen.getByText('gauss_seidel')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'gauss_seidel' })).not.toBeInTheDocument();
    });

    it('treats a target without target_kind as a navigable class (backend default)', async () => {
        mockMetadata.mockResolvedValue({
            ...emptyMetadata,
            restrictions: [
                {
                    property: { id: 'has_data', label: 'has_data' },
                    kind: 'all_values_from',
                    target: { id: 'data_1', label: 'data_1' },
                },
            ],
        });
        render(<ClassInspector classId="solvers" />);
        expect(await screen.findByRole('button', { name: 'data_1' })).toBeInTheDocument();
    });

    it('renders an intersection target as linked members joined by &', async () => {
        mockMetadata.mockResolvedValue({
            ...emptyMetadata,
            restrictions: [
                {
                    property: { id: 'has_part', label: 'has_part' },
                    kind: 'some_values_from',
                    target_kind: 'intersection',
                    target: {
                        id: 'bnode_1',
                        label: 'a & b',
                        members: [
                            { id: 'a', label: 'a' },
                            { id: 'b', label: 'b' },
                        ],
                    },
                },
            ],
        });
        render(<ClassInspector classId="solvers" />);
        expect(await screen.findByRole('button', { name: 'a' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'b' })).toBeInTheDocument();
        expect(screen.getByText(/&/)).toBeInTheDocument();
    });

    it('shows the fallback texts for a bare class', async () => {
        mockMetadata.mockResolvedValue(emptyMetadata);
        render(<ClassInspector classId="solvers" />);
        expect(await screen.findByText('No description available')).toBeInTheDocument();
        expect(screen.getByText('None (Root Class)')).toBeInTheDocument();
        expect(screen.getByText('None (Leaf Class)')).toBeInTheDocument();
        expect(screen.getByText('No class restrictions asserted')).toBeInTheDocument();
    });

    it('navigates to a related class and clears the instance selection', async () => {
        mockMetadata.mockResolvedValue({ ...emptyMetadata, superclasses: [{ id: 'solvers', label: 'solvers' }] });
        const onUrlUpdate = vi.fn();
        render(<ClassInspector classId="fluid_solver" />, { searchParams: '?class=fluid_solver&instance=instance_1', onUrlUpdate });
        await userEvent.click(await screen.findByRole('button', { name: 'solvers' }));
        const params = onUrlUpdate.mock.lastCall?.[0].searchParams;
        expect(params?.get('class')).toBe('solvers');
        expect(params?.get('instance')).toBeNull();
    });

    it('collapses long related-class lists behind a "+N more" toggle', async () => {
        const subclasses = Array.from({ length: 7 }, (_, index) => ({ id: `sub_${index + 1}`, label: `sub_${index + 1}` }));
        mockMetadata.mockResolvedValue({ ...emptyMetadata, subclasses });
        render(<ClassInspector classId="solvers" />);
        expect(await screen.findByRole('button', { name: 'sub_5' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'sub_6' })).not.toBeInTheDocument();

        const toggle = screen.getByRole('button', { name: '+2 more' });
        await userEvent.click(toggle);
        expect(screen.getByRole('button', { name: 'sub_7' })).toBeInTheDocument();
        expect(toggle).toHaveTextContent('Show less');

        await userEvent.click(toggle);
        expect(screen.queryByRole('button', { name: 'sub_7' })).not.toBeInTheDocument();
    });

    it('shows a list one entry over the limit in full — collapsing must hide at least two', async () => {
        const subclasses = Array.from({ length: 6 }, (_, index) => ({ id: `sub_${index + 1}`, label: `sub_${index + 1}` }));
        mockMetadata.mockResolvedValue({ ...emptyMetadata, subclasses });
        render(<ClassInspector classId="solvers" />);
        expect(await screen.findByRole('button', { name: 'sub_6' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /more$/ })).not.toBeInTheDocument();
    });

    it('shows a non-fatal warning when the metadata cannot be loaded', async () => {
        mockMetadata.mockRejectedValue(new Error('network down'));
        render(<ClassInspector classId="solvers" />);
        expect(await screen.findByText('Could not load the class details')).toBeInTheDocument();
    });
});
