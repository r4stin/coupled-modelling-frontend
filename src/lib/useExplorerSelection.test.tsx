import userEvent from '@testing-library/user-event';
import { describe, expect, it, Mock, vi } from 'vitest';

import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { render, screen } from '@/testUtils';

/** Minimal surface exposing each selection operation as a button. */
const SelectionProbe = () => {
    const { selectClass, selectInstance, alignClassWithInstanceTypes, clearRemovedInstance } = useExplorerSelection();
    return (
        <>
            <button type="button" onClick={() => selectClass('solvers')}>
                select class
            </button>
            <button type="button" onClick={() => selectInstance('instance_2')}>
                select instance
            </button>
            <button type="button" onClick={() => alignClassWithInstanceTypes(['coupled_system'])}>
                align
            </button>
            <button type="button" onClick={() => clearRemovedInstance()}>
                clear removed
            </button>
        </>
    );
};

const lastUpdate = (onUrlUpdate: Mock) => onUrlUpdate.mock.lastCall?.[0];

describe('useExplorerSelection', () => {
    it('pushes one history entry per user-initiated selection so browser Back retraces them', async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<SelectionProbe />, { searchParams: '?class=coupled_system&instance=instance_1', onUrlUpdate });

        await user.click(screen.getByRole('button', { name: 'select class' }));
        // The class change and the instance clear batch into a single URL update.
        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        expect(lastUpdate(onUrlUpdate).options.history).toBe('push');
        expect(lastUpdate(onUrlUpdate).searchParams.get('class')).toBe('solvers');
        expect(lastUpdate(onUrlUpdate).searchParams.get('instance')).toBeNull();

        await user.click(screen.getByRole('button', { name: 'select instance' }));
        expect(lastUpdate(onUrlUpdate).options.history).toBe('push');
        expect(lastUpdate(onUrlUpdate).searchParams.get('instance')).toBe('instance_2');
    });

    it('ignores re-selecting the current class or instance instead of stacking duplicate entries', async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<SelectionProbe />, { searchParams: '?class=solvers&instance=instance_2', onUrlUpdate });

        await user.click(screen.getByRole('button', { name: 'select class' }));
        await user.click(screen.getByRole('button', { name: 'select instance' }));
        expect(onUrlUpdate).not.toHaveBeenCalled();
    });

    it('replaces the current entry when aligning the class, so Back never revisits the misaligned URL', async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<SelectionProbe />, { searchParams: '?class=solvers&instance=instance_9', onUrlUpdate });

        await user.click(screen.getByRole('button', { name: 'align' }));
        expect(lastUpdate(onUrlUpdate).options.history).toBe('replace');
        expect(lastUpdate(onUrlUpdate).searchParams.get('class')).toBe('coupled_system');
        expect(lastUpdate(onUrlUpdate).searchParams.get('instance')).toBe('instance_9');
    });

    it('replaces the current entry when clearing a removed instance, so Back skips its dead URL', async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<SelectionProbe />, { searchParams: '?class=solvers&instance=instance_9', onUrlUpdate });

        await user.click(screen.getByRole('button', { name: 'clear removed' }));
        expect(lastUpdate(onUrlUpdate).options.history).toBe('replace');
        expect(lastUpdate(onUrlUpdate).searchParams.get('instance')).toBeNull();
        expect(lastUpdate(onUrlUpdate).searchParams.get('class')).toBe('solvers');
    });
});
