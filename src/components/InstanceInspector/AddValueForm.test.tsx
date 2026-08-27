import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AddValueForm from '@/components/InstanceInspector/AddValueForm';
import { addValues } from '@/services/backend/instances';
import { render, screen } from '@/testUtils';

vi.mock('@/services/backend/instances', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/instances')>()),
    addValues: vi.fn(),
}));

const mockAddValues = vi.mocked(addValues);

describe('AddValueForm', () => {
    it('adds a string value for the selected property', async () => {
        mockAddValues.mockResolvedValue(new Response() as never);
        const onAdded = vi.fn();
        const user = userEvent.setup();
        render(<AddValueForm instanceId="instance_1" onAdded={onAdded} />);

        await user.click(screen.getByRole('button', { name: /property to add/i }));
        await user.click(await screen.findByRole('option', { name: 'parallel_type' }));
        await user.type(screen.getByRole('textbox', { name: 'New value' }), 'OpenMP');
        await user.click(screen.getByRole('button', { name: 'Add' }));

        expect(mockAddValues).toHaveBeenCalledWith('instance_1', { parallel_type: 'OpenMP' });
        expect(onAdded).toHaveBeenCalled();
        expect(screen.getByRole('textbox', { name: 'New value' })).toHaveValue('');
    });

    it('parses the value according to the chosen value type', async () => {
        mockAddValues.mockResolvedValue(new Response() as never);
        const user = userEvent.setup();
        render(<AddValueForm instanceId="instance_1" onAdded={() => undefined} />);

        await user.click(screen.getByRole('button', { name: /property to add/i }));
        await user.click(await screen.findByRole('option', { name: 'echo_level' }));
        await user.click(screen.getByRole('button', { name: /value type/i }));
        await user.click(await screen.findByRole('option', { name: 'Integer' }));
        await user.type(screen.getByRole('textbox', { name: 'New value' }), '4');
        await user.click(screen.getByRole('button', { name: 'Add' }));

        expect(mockAddValues).toHaveBeenCalledWith('instance_1', { echo_level: 4 });
    });

    it('rejects an invalid integer without calling the backend', async () => {
        const user = userEvent.setup();
        render(<AddValueForm instanceId="instance_1" onAdded={() => undefined} />);

        await user.click(screen.getByRole('button', { name: /value type/i }));
        await user.click(await screen.findByRole('option', { name: 'Integer' }));
        await user.type(screen.getByRole('textbox', { name: 'New value' }), 'not-a-number');
        await user.click(screen.getByRole('button', { name: 'Add' }));

        expect(mockAddValues).not.toHaveBeenCalled();
    });

    it('offers a true/false select for the Boolean type', async () => {
        mockAddValues.mockResolvedValue(new Response() as never);
        const user = userEvent.setup();
        render(<AddValueForm instanceId="instance_1" onAdded={() => undefined} />);

        await user.click(screen.getByRole('button', { name: /property to add/i }));
        await user.click(await screen.findByRole('option', { name: 'print_colors' }));
        await user.click(screen.getByRole('button', { name: /value type/i }));
        await user.click(await screen.findByRole('option', { name: 'Boolean' }));

        expect(screen.queryByRole('textbox', { name: 'New value' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /new value/i }));
        await user.click(await screen.findByRole('option', { name: 'true' }));
        await user.click(screen.getByRole('button', { name: 'Add' }));

        expect(mockAddValues).toHaveBeenCalledWith('instance_1', { print_colors: true });
    });

    it('requires the instance prefix for Object ID values', async () => {
        const user = userEvent.setup();
        render(<AddValueForm instanceId="instance_1" onAdded={() => undefined} />);

        await user.click(screen.getByRole('button', { name: /value type/i }));
        await user.click(await screen.findByRole('option', { name: 'Object ID' }));
        await user.type(screen.getByRole('textbox', { name: 'New value' }), 'solver_9');
        await user.click(screen.getByRole('button', { name: 'Add' }));

        expect(mockAddValues).not.toHaveBeenCalled();
    });
});
