import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import DownloadOwl from '@/components/Layout/DownloadOwl';
import { downloadBlob } from '@/lib/fileTransfer';
import { downloadOwl } from '@/services/backend/ontology';
import { render, screen } from '@/testUtils';

vi.mock('@/services/backend/ontology', () => ({
    downloadOwl: vi.fn(),
}));

vi.mock('@/lib/fileTransfer', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/fileTransfer')>()),
    downloadBlob: vi.fn(),
}));

const mockDownloadOwl = vi.mocked(downloadOwl);
const mockDownloadBlob = vi.mocked(downloadBlob);

describe('DownloadOwl', () => {
    it('fetches the ontology and saves it as a file', async () => {
        const blob = new Blob(['<rdf/>'], { type: 'application/rdf+xml' });
        mockDownloadOwl.mockResolvedValue(blob);
        const user = userEvent.setup();
        render(<DownloadOwl />);

        await user.click(screen.getByRole('button', { name: 'Download OWL' }));

        expect(mockDownloadOwl).toHaveBeenCalled();
        expect(mockDownloadBlob).toHaveBeenCalledWith('onto.owl', blob);
    });

    it('keeps the explorer in place when the download fails', async () => {
        mockDownloadOwl.mockRejectedValue(new Error('GraphDB unavailable'));
        const user = userEvent.setup();
        render(<DownloadOwl />);

        await user.click(screen.getByRole('button', { name: 'Download OWL' }));

        expect(mockDownloadBlob).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Download OWL' })).toBeInTheDocument();
    });
});
