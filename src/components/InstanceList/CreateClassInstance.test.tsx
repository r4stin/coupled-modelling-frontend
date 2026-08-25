import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import CreateClassInstance from '@/components/InstanceList/CreateClassInstance';
import { createClassInstance } from '@/services/backend/classes';
import { render, screen } from '@/testUtils';

vi.mock('@/services/backend/classes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/classes')>()),
    createClassInstance: vi.fn(),
}));

const mockCreateClassInstance = vi.mocked(createClassInstance);

describe('CreateClassInstance', () => {
    it('creates a labelled instance of the class and selects it', async () => {
        mockCreateClassInstance.mockResolvedValue('instance_new');
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<CreateClassInstance classId="solvers" />, { searchParams: '?class=solvers', onUrlUpdate });

        await user.click(screen.getByRole('button', { name: 'Add instance' }));
        await user.type(await screen.findByLabelText('Instance label'), 'Airfoil fluid solver');
        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(mockCreateClassInstance).toHaveBeenCalledWith('solvers', 'Airfoil fluid solver');
        const updatedParams = onUrlUpdate.mock.calls.at(-1)?.[0].searchParams as URLSearchParams;
        expect(updatedParams.get('instance')).toBe('instance_new');
    });

    it('requires a label before creating', async () => {
        const user = userEvent.setup();
        render(<CreateClassInstance classId="solvers" />);

        await user.click(screen.getByRole('button', { name: 'Add instance' }));
        await user.click(await screen.findByRole('button', { name: 'Create' }));

        expect(mockCreateClassInstance).not.toHaveBeenCalled();
    });
});
