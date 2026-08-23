import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import InstanceList from '@/components/InstanceList/InstanceList';
import { getClassInstanceSummaries } from '@/services/backend/classes';
import { render, screen } from '@/testUtils';
import { ClassInstanceSummary } from '@/types/backend';

vi.mock('@/services/backend/classes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/classes')>()),
    getClassInstanceSummaries: vi.fn(),
}));

const mockSummaries = vi.mocked(getClassInstanceSummaries);

const summaries = [
    {
        id: 'instance_1',
        label: 'Fluid solver',
        types: ['solvers'],
        property_preview: [
            { property: 'parallel_type', value: 'OpenMP', kind: 'literal' },
            { property: 'echo_level', value: 1, kind: 'literal' },
        ],
        preview_truncated: true,
    },
    {
        id: 'instance_2',
        label: 'instance_2',
        types: ['data'],
        property_preview: [],
        preview_truncated: false,
    },
] satisfies ClassInstanceSummary[];

describe('InstanceList', () => {
    it('renders instances grouped by type with preview chips and a truncation marker', async () => {
        mockSummaries.mockResolvedValue(summaries);
        render(<InstanceList classId="coupled_system" />);
        expect(await screen.findByRole('heading', { name: 'solvers' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'data' })).toBeInTheDocument();
        // Label with differing id shows the id as a suffix; identical label/id shows no suffix.
        expect(screen.getByText('Fluid solver')).toBeInTheDocument();
        expect(screen.getByText('(instance_1)')).toBeInTheDocument();
        expect(screen.queryByText('(instance_2)')).not.toBeInTheDocument();
        expect(screen.getByText('parallel_type:')).toBeInTheDocument();
        expect(screen.getByText(/\+ more/)).toBeInTheDocument();
    });

    it('filters instances client-side', async () => {
        mockSummaries.mockResolvedValue(summaries);
        render(<InstanceList classId="coupled_system" />);
        await screen.findByText('Fluid solver');
        await userEvent.type(screen.getByRole('searchbox', { name: 'Filter instances' }), 'fluid');
        expect(screen.getByText('Fluid solver')).toBeInTheDocument();
        expect(screen.queryByText('instance_2')).not.toBeInTheDocument();
    });

    it('selecting an instance writes it to the URL', async () => {
        mockSummaries.mockResolvedValue(summaries);
        const onUrlUpdate = vi.fn();
        render(<InstanceList classId="coupled_system" />, { onUrlUpdate });
        await userEvent.click(await screen.findByText('Fluid solver'));
        expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get('instance')).toBe('instance_1');
    });

    it('marks the instance from the URL as selected', async () => {
        mockSummaries.mockResolvedValue(summaries);
        render(<InstanceList classId="coupled_system" />, { searchParams: '?instance=instance_1' });
        const button = (await screen.findByText('Fluid solver')).closest('button');
        expect(button).toHaveAttribute('aria-current', 'true');
    });

    it('shows an empty state when the class has no instances', async () => {
        mockSummaries.mockResolvedValue([]);
        render(<InstanceList classId="coupled_system" />);
        expect(await screen.findByText('No instances found for this class.')).toBeInTheDocument();
    });

    it('shows an error state when instances cannot be loaded', async () => {
        mockSummaries.mockRejectedValue(new Error('network down'));
        render(<InstanceList classId="coupled_system" />);
        expect(await screen.findByText('Could not load the instances')).toBeInTheDocument();
    });
});
