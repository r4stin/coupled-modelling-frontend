import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AddChildDialog from '@/components/InstanceInspector/AddChildDialog';
import { createInstance } from '@/services/backend/instances';
import { render, screen } from '@/testUtils';

vi.mock('@/services/backend/instances', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/instances')>()),
    createInstance: vi.fn(),
}));

const mockCreateInstance = vi.mocked(createInstance);

describe('AddChildDialog', () => {
    it('creates a labelled child via the selected property and closes', async () => {
        mockCreateInstance.mockResolvedValue('instance_new_child');
        const onCreated = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<AddChildDialog isOpen parentId="instance_1" onCreated={onCreated} onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: /property \(and target class\)/i }));
        await user.click(await screen.findByRole('option', { name: /convergence_accelerators/ }));
        await user.type(screen.getByLabelText('New instance label'), 'MyAccel');
        await user.click(screen.getByRole('button', { name: 'Add child' }));

        expect(mockCreateInstance).toHaveBeenCalledWith('convergence_accelerators', 'instance_1', { label: 'MyAccel' });
        expect(onCreated).toHaveBeenCalledWith('convergence_accelerators');
        expect(onClose).toHaveBeenCalled();
    });

    it('requires a label before creating', async () => {
        const user = userEvent.setup();
        render(<AddChildDialog isOpen parentId="instance_1" onCreated={() => undefined} onClose={() => undefined} />);

        await user.click(screen.getByRole('button', { name: 'Add child' }));

        expect(mockCreateInstance).not.toHaveBeenCalled();
    });
});
