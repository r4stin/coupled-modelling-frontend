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
    it('renders the title, the theme toggle, and the health indicator', async () => {
        mockGetHealth.mockResolvedValue({ status: 'ok', graphdb: 'connected', repository: 'coupled_modelling' } satisfies HealthResponse);
        render(<Header />);
        expect(screen.getByRole('heading', { name: APP_TITLE })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /switch to (dark|light) theme/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Download OWL' })).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'GraphDB connected · coupled_modelling' })).toBeInTheDocument();
    });
});
