import { describe, expect, it, vi } from 'vitest';

import Header from '@/components/Layout/Header';
import { APP_TITLE } from '@/constants/app';
import { getHealth } from '@/services/backend/health';
import { render, screen } from '@/testUtils';
import { HealthResponse } from '@/types/backend';

vi.mock('@/services/backend/health', () => ({
    healthUrl: 'health/',
    getHealth: vi.fn(),
}));

const mockGetHealth = vi.mocked(getHealth);

describe('Header', () => {
    it('renders the title, the controls, and the connected status', async () => {
        mockGetHealth.mockResolvedValue({ status: 'ok', graphdb: 'connected', repository: 'coupled_modelling' } satisfies HealthResponse);
        render(<Header />);
        expect(screen.getByRole('heading', { name: APP_TITLE })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /switch to (dark|light) theme/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Refresh connection status' })).toBeInTheDocument();
        expect(await screen.findByText('GraphDB connected · coupled_modelling')).toBeInTheDocument();
    });

    it('shows the warning state when the backend reports GraphDB as down', async () => {
        mockGetHealth.mockResolvedValue({
            status: 'error',
            graphdb: 'unavailable',
            repository: 'coupled_modelling',
            error: 'connection refused',
        } satisfies HealthResponse);
        render(<Header />);
        expect(await screen.findByText('GraphDB unavailable')).toBeInTheDocument();
    });

    it('shows the danger state when the backend itself is unreachable', async () => {
        mockGetHealth.mockRejectedValue(new Error('network down'));
        render(<Header />);
        expect(await screen.findByText('Backend unreachable')).toBeInTheDocument();
    });
});
