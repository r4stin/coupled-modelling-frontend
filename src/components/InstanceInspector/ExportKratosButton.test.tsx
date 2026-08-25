import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ExportKratosButton from '@/components/InstanceInspector/ExportKratosButton';
import { downloadJson } from '@/lib/fileTransfer';
import { getClassHierarchyMetadata } from '@/services/backend/classes';
import { exportCoupledKratos } from '@/services/backend/coupled';
import { render, screen } from '@/testUtils';

vi.mock('@/services/backend/classes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/classes')>()),
    getClassHierarchyMetadata: vi.fn(),
}));

vi.mock('@/services/backend/coupled', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/coupled')>()),
    exportCoupledKratos: vi.fn(),
}));

vi.mock('@/lib/fileTransfer', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/fileTransfer')>()),
    downloadJson: vi.fn(),
}));

const mockHierarchy = vi.mocked(getClassHierarchyMetadata);
const mockExport = vi.mocked(exportCoupledKratos);
const mockDownloadJson = vi.mocked(downloadJson);

const hierarchy = [
    { class: 'coupled_system', parents: [] },
    { class: 'fsi_system', parents: ['coupled_system'] },
    { class: 'solvers', parents: [] },
];

describe('ExportKratosButton', () => {
    it('downloads the export for a coupled-system subclass instance', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        mockExport.mockResolvedValue({ problem_data: { echo_level: 1 } });
        const user = userEvent.setup();
        render(<ExportKratosButton instanceId="instance_1" types={['fsi_system']} />);

        await user.click(await screen.findByRole('button', { name: 'Export JSON' }));

        expect(mockExport).toHaveBeenCalledWith('instance_1');
        expect(mockDownloadJson).toHaveBeenCalledWith('instance_1_kratos.json', { problem_data: { echo_level: 1 } });
    });

    it('renders nothing for instances outside the coupled-system hierarchy', async () => {
        mockHierarchy.mockResolvedValue(hierarchy);
        render(<ExportKratosButton instanceId="instance_2" types={['solvers']} />);

        // Wait for the hierarchy fetch to settle, then confirm no button appeared.
        await vi.waitFor(() => expect(mockHierarchy).toHaveBeenCalled());
        expect(screen.queryByRole('button', { name: 'Export JSON' })).not.toBeInTheDocument();
    });
});
