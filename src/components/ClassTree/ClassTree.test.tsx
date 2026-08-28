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
        expect(await screen.findByRole('row', { name: 'solvers' })).toBeInTheDocument();
        expect(screen.getByRole('row', { name: 'data' })).toBeInTheDocument();
        expect(screen.queryByRole('row', { name: 'fluid_solver' })).not.toBeInTheDocument();
    });

    it('expands a branch with the toggle without selecting it', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        const onUrlUpdate = vi.fn();
        render(<ClassTree />, { onUrlUpdate });
        await userEvent.click(await screen.findByRole('button', { name: 'Expand solvers' }));
        expect(screen.getByRole('row', { name: 'fluid_solver' })).toBeInTheDocument();
        expect(onUrlUpdate).not.toHaveBeenCalled();
    });

    it('selecting a class writes it to the URL and reveals its subclasses', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        const onUrlUpdate = vi.fn();
        render(<ClassTree />, { onUrlUpdate });
        await userEvent.click(await screen.findByRole('row', { name: 'solvers' }));
        expect(screen.getByRole('row', { name: 'fluid_solver' })).toBeInTheDocument();
        expect(onUrlUpdate).toHaveBeenCalled();
        expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get('class')).toBe('solvers');
    });

    it('marks the class from the URL as selected', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        render(<ClassTree />, { searchParams: '?class=data' });
        expect(await screen.findByRole('row', { name: 'data' })).toHaveAttribute('aria-selected', 'true');
    });

    it('reveals a nested class arriving via the URL by expanding its ancestors', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        render(<ClassTree />, { searchParams: '?class=fluid_solver' });
        const row = await screen.findByRole('row', { name: 'fluid_solver' });
        expect(row).toHaveAttribute('aria-selected', 'true');
        expect(row).toHaveAttribute('aria-level', '2');
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
        expect(screen.getAllByRole('row', { name: 'shared' })).toHaveLength(2);
        // Expanding the copy under 'a' must not expand the copy under 'b'.
        await userEvent.click(screen.getAllByRole('button', { name: 'Expand shared' })[0]);
        expect(screen.getAllByRole('row', { name: 'leaf' })).toHaveLength(1);
    });

    it('clears the selected instance when a different class is selected', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        const onUrlUpdate = vi.fn();
        render(<ClassTree />, { searchParams: '?class=solvers&instance=instance_1', onUrlUpdate });
        await userEvent.click(await screen.findByRole('row', { name: 'data' }));
        const params = onUrlUpdate.mock.lastCall?.[0].searchParams;
        expect(params?.get('class')).toBe('data');
        expect(params?.get('instance')).toBeNull();
    });

    it('keeps the selected instance when re-selecting the same class', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        const onUrlUpdate = vi.fn();
        render(<ClassTree />, { searchParams: '?class=solvers&instance=instance_1', onUrlUpdate });
        await userEvent.click(await screen.findByRole('row', { name: 'solvers' }));
        expect(onUrlUpdate).not.toHaveBeenCalled();
    });

    it('re-selecting a collapsed class reveals its subclasses again without a new history entry', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        const onUrlUpdate = vi.fn();
        render(<ClassTree />, { onUrlUpdate });
        await userEvent.click(await screen.findByRole('row', { name: 'solvers' }));
        expect(screen.getByRole('row', { name: 'fluid_solver' })).toBeInTheDocument();
        const updates = onUrlUpdate.mock.calls.length;

        await userEvent.click(screen.getByRole('button', { name: 'Collapse solvers' }));
        expect(screen.queryByRole('row', { name: 'fluid_solver' })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('row', { name: 'solvers' }));
        expect(screen.getByRole('row', { name: 'fluid_solver' })).toBeInTheDocument();
        expect(onUrlUpdate.mock.calls.length).toBe(updates);
    });

    it('Enter on the already-selected collapsed class reveals its subclasses', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        const user = userEvent.setup();
        render(<ClassTree />, { searchParams: '?class=solvers' });
        await screen.findByRole('row', { name: 'fluid_solver' });

        await user.click(screen.getByRole('button', { name: 'Collapse solvers' }));
        expect(screen.queryByRole('row', { name: 'fluid_solver' })).not.toBeInTheDocument();

        screen.getByRole('row', { name: 'solvers' }).focus();
        await user.keyboard('{Enter}');
        expect(screen.getByRole('row', { name: 'fluid_solver' })).toBeInTheDocument();
    });

    it('supports full keyboard navigation: arrows move and expand, Enter selects', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ClassTree />, { onUrlUpdate });
        await screen.findByRole('row', { name: 'solvers' });

        await user.tab();
        expect(screen.getByRole('row', { name: 'data' })).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('row', { name: 'solvers' })).toHaveFocus();

        // Right/Left arrows expand and collapse without selecting.
        await user.keyboard('{ArrowRight}');
        expect(screen.getByRole('row', { name: 'solvers' })).toHaveAttribute('aria-expanded', 'true');
        await user.keyboard('{ArrowLeft}');
        expect(screen.getByRole('row', { name: 'solvers' })).toHaveAttribute('aria-expanded', 'false');
        await user.keyboard('{ArrowRight}');
        expect(onUrlUpdate).not.toHaveBeenCalled();

        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('row', { name: 'fluid_solver' })).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get('class')).toBe('fluid_solver');
    });

    it('moves keyboard focus straight to the selected class arriving via the URL', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        render(<ClassTree />, { searchParams: '?class=fluid_solver' });
        await screen.findByRole('row', { name: 'fluid_solver' });

        await userEvent.tab();
        expect(screen.getByRole('row', { name: 'fluid_solver' })).toHaveFocus();
    });

    it('shows an error message when the hierarchy cannot be loaded', async () => {
        mockHierarchy.mockRejectedValue(new Error('network down'));
        render(<ClassTree />);
        expect(await screen.findByText(/could not load the class hierarchy/i)).toBeInTheDocument();
    });
});
