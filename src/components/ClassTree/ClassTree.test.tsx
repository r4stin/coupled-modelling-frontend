import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ClassTree from '@/components/ClassTree/ClassTree';
import { getClassHierarchyMetadata } from '@/services/backend/classes';
import { render, screen } from '@/testUtils';
import { ClassHierarchyMetadata } from '@/types/backend';

vi.mock('@/services/backend/classes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/classes')>()),
    getClassHierarchyMetadata: vi.fn(),
}));

const mockHierarchy = vi.mocked(getClassHierarchyMetadata);

const hierarchy = [
    { class: 'solvers', parents: [] },
    { class: 'fluid_solver', parents: ['solvers'] },
    { class: 'data', parents: [] },
] satisfies ClassHierarchyMetadata;

describe('ClassTree', () => {
    it('renders root classes with subclasses collapsed', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        render(<ClassTree />);
        expect(await screen.findByRole('button', { name: 'solvers' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'data' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'fluid_solver' })).not.toBeInTheDocument();
    });

    it('expands a branch with the toggle without selecting it', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        const onUrlUpdate = vi.fn();
        render(<ClassTree />, { onUrlUpdate });
        await userEvent.click(await screen.findByRole('button', { name: 'Expand solvers' }));
        expect(screen.getByRole('button', { name: 'fluid_solver' })).toBeInTheDocument();
        expect(onUrlUpdate).not.toHaveBeenCalled();
    });

    it('selecting a class writes it to the URL and reveals its subclasses', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        const onUrlUpdate = vi.fn();
        render(<ClassTree />, { onUrlUpdate });
        await userEvent.click(await screen.findByRole('button', { name: 'solvers' }));
        expect(screen.getByRole('button', { name: 'fluid_solver' })).toBeInTheDocument();
        expect(onUrlUpdate).toHaveBeenCalled();
        expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get('class')).toBe('solvers');
    });

    it('marks the class from the URL as selected', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        render(<ClassTree />, { searchParams: '?class=data' });
        expect(await screen.findByRole('button', { name: 'data' })).toHaveAttribute('aria-current', 'true');
    });

    it('reveals a nested class arriving via the URL by expanding its ancestors', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        render(<ClassTree />, { searchParams: '?class=fluid_solver' });
        expect(await screen.findByRole('button', { name: 'fluid_solver' })).toHaveAttribute('aria-current', 'true');
    });

    it('expands each occurrence of a multi-parent class independently', async () => {
        mockHierarchy.mockResolvedValue([
            { class: 'a', parents: [] },
            { class: 'b', parents: [] },
            { class: 'shared', parents: ['a', 'b'] },
            { class: 'leaf', parents: ['shared'] },
        ]);
        render(<ClassTree />);
        await userEvent.click(await screen.findByRole('button', { name: 'Expand a' }));
        await userEvent.click(screen.getByRole('button', { name: 'Expand b' }));
        expect(screen.getAllByRole('button', { name: 'shared' })).toHaveLength(2);
        // Expanding the copy under 'a' must not expand the copy under 'b'.
        await userEvent.click(screen.getAllByRole('button', { name: 'Expand shared' })[0]);
        expect(screen.getAllByRole('button', { name: 'leaf' })).toHaveLength(1);
    });

    it('shows an error message when the hierarchy cannot be loaded', async () => {
        mockHierarchy.mockRejectedValue(new Error('network down'));
        render(<ClassTree />);
        expect(await screen.findByText(/could not load the class hierarchy/i)).toBeInTheDocument();
    });
});
