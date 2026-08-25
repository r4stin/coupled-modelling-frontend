import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ImportKratos from '@/components/Layout/ImportKratos';
import { importCoupledKratos } from '@/services/backend/coupled';
import { render, screen } from '@/testUtils';

vi.mock('@/services/backend/coupled', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/coupled')>()),
    importCoupledKratos: vi.fn(),
}));

const mockImport = vi.mocked(importCoupledKratos);

const pickFile = async (user: ReturnType<typeof userEvent.setup>, content: string, name: string) => {
    await user.upload(screen.getByLabelText('Kratos configuration file'), new File([content], name, { type: 'application/json' }));
};

describe('ImportKratos', () => {
    it('imports the parsed file under the confirmed label and selects the new coupled system', async () => {
        mockImport.mockResolvedValue('instance_imported');
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ImportKratos />, { onUrlUpdate });

        await pickFile(user, '{"problem_data": {"echo_level": 1}}', 'FSI_Mok-config.json');
        const labelInput = await screen.findByLabelText('Configuration label');
        expect(labelInput).toHaveValue('FSI Mok config');
        await user.click(screen.getByRole('button', { name: 'Import' }));

        expect(mockImport).toHaveBeenCalledWith({ problem_data: { echo_level: 1 } }, 'FSI Mok config');
        await vi.waitFor(() => {
            const updatedParams = onUrlUpdate.mock.calls.at(-1)?.[0].searchParams as URLSearchParams;
            expect(updatedParams.get('instance')).toBe('instance_imported');
        });
    });

    it('rejects a file that is not valid JSON without calling the backend', async () => {
        const user = userEvent.setup();
        render(<ImportKratos />);

        await pickFile(user, 'not json at all', 'broken.json');
        await screen.findByLabelText('Configuration label');
        await user.click(screen.getByRole('button', { name: 'Import' }));

        // Anchoring on the toast makes sure the async file read has finished.
        expect(await screen.findByText('The selected file is not valid JSON')).toBeInTheDocument();
        expect(mockImport).not.toHaveBeenCalled();
    });

    it('rejects JSON that is not an object without calling the backend', async () => {
        const user = userEvent.setup();
        render(<ImportKratos />);

        await pickFile(user, '[1, 2, 3]', 'list.json');
        await screen.findByLabelText('Configuration label');
        await user.click(screen.getByRole('button', { name: 'Import' }));

        expect(await screen.findByText('The selected file must contain a JSON object')).toBeInTheDocument();
        expect(mockImport).not.toHaveBeenCalled();
    });
});
