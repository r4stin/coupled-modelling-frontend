import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import HealthIndicator from '@/components/Layout/HealthIndicator';
import { getHealth } from '@/services/backend/health';
import { render, screen } from '@/testUtils';
import { HealthResponse } from '@/types/backend';

vi.mock('@/services/backend/health', () => ({
    healthUrl: 'health/',
    getHealth: vi.fn(),
}));

const mockGetHealth = vi.mocked(getHealth);

const connectedResponse = { status: 'ok', graphdb: 'connected', repository: 'coupled_modelling' } satisfies HealthResponse;

describe('HealthIndicator', () => {
    it('labels the button with the connected status and repository name', async () => {
        mockGetHealth.mockResolvedValue(connectedResponse);
        render(<HealthIndicator />);
        expect(await screen.findByRole('button', { name: 'GraphDB connected · coupled_modelling' })).toBeInTheDocument();
    });

    it('shows the warning state when the backend reports GraphDB as down', async () => {
        mockGetHealth.mockResolvedValue({
            status: 'error',
            graphdb: 'unavailable',
            repository: 'coupled_modelling',
            error: 'connection refused',
        } satisfies HealthResponse);
        render(<HealthIndicator />);
        expect(await screen.findByRole('button', { name: 'GraphDB unavailable' })).toBeInTheDocument();
    });

    it('shows the danger state when the backend itself is unreachable', async () => {
        mockGetHealth.mockRejectedValue(new Error('network down'));
        render(<HealthIndicator />);
        expect(await screen.findByRole('button', { name: 'Backend unreachable' })).toBeInTheDocument();
    });

    it('re-checks the connection when the button is clicked', async () => {
        mockGetHealth.mockResolvedValue(connectedResponse);
        const user = userEvent.setup();
        render(<HealthIndicator />);
        await user.click(await screen.findByRole('button', { name: 'GraphDB connected · coupled_modelling' }));
        expect(mockGetHealth).toHaveBeenCalledTimes(2);
    });

    it('shows the status details in a tooltip on keyboard focus', async () => {
        mockGetHealth.mockResolvedValue(connectedResponse);
        const user = userEvent.setup();
        render(<HealthIndicator />);
        await screen.findByRole('button', { name: 'GraphDB connected · coupled_modelling' });
        await user.tab();
        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip).toHaveTextContent('GraphDB connected · coupled_modelling');
        expect(tooltip).toHaveTextContent('Click to refresh');
    });
});
