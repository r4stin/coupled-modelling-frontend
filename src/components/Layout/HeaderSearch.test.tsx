import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import HeaderSearch from '@/components/Layout/HeaderSearch';
import { searchEntities } from '@/services/backend/search';
import { render, screen, waitFor } from '@/testUtils';
import { SearchResults } from '@/types/backend';

vi.mock('@/services/backend/search', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/search')>()),
    searchEntities: vi.fn(),
}));

const mockSearch = vi.mocked(searchEntities);

const results: SearchResults = {
    classes: [{ id: 'coupled_system' }],
    instances: [{ id: 'instance_43', label: 'Onera_FSI', types: ['coupled_system_2'], property_preview: [], preview_truncated: false }],
};

const searchInput = () => screen.getByRole('searchbox', { name: 'Search the knowledge base' });

describe('HeaderSearch', () => {
    it('shows grouped results while typing and selecting an instance selects it with its class', async () => {
        mockSearch.mockResolvedValue(results);
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<HeaderSearch />, { onUrlUpdate });

        await user.type(searchInput(), 'onera');
        expect(await screen.findByText('Classes')).toBeInTheDocument();
        expect(screen.getByText('Instances')).toBeInTheDocument();

        await user.click(screen.getByRole('menuitem', { name: 'Onera_FSI' }));
        await waitFor(() => {
            const params = onUrlUpdate.mock.lastCall?.[0].searchParams;
            expect(params?.get('instance')).toBe('instance_43');
            expect(params?.get('class')).toBe('coupled_system_2');
        });
        expect(mockSearch).toHaveBeenCalledWith('onera', 'all');
        expect(searchInput()).toHaveValue('');
    });

    it('selecting a class result selects the class and clears the instance', async () => {
        mockSearch.mockResolvedValue(results);
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<HeaderSearch />, { searchParams: '?class=solvers&instance=instance_9', onUrlUpdate });

        await user.type(searchInput(), 'coup');
        await user.click(await screen.findByRole('menuitem', { name: 'coupled_system' }));
        await waitFor(() => {
            const params = onUrlUpdate.mock.lastCall?.[0].searchParams;
            expect(params?.get('class')).toBe('coupled_system');
            expect(params?.get('instance')).toBeNull();
        });
    });

    it('the filter toggle restricts the search type', async () => {
        mockSearch.mockResolvedValue({ classes: [{ id: 'coupled_system' }], instances: [] });
        const user = userEvent.setup();
        render(<HeaderSearch />);

        await user.click(screen.getByRole('button', { name: 'Search filter: All' }));
        await user.click(await screen.findByRole('radio', { name: 'Classes' }));
        await user.type(searchInput(), 'coup');
        await waitFor(() => expect(mockSearch).toHaveBeenCalledWith('coup', 'class'));
    });

    it('shows the no-matches state without any selectable rows', async () => {
        mockSearch.mockResolvedValue({ classes: [], instances: [] });
        const user = userEvent.setup();
        render(<HeaderSearch />);

        await user.type(searchInput(), 'zzz');
        expect(await screen.findByText('No matches')).toBeInTheDocument();
        expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
    });

    it('clearing the input hides the results without waiting for the debounce', async () => {
        mockSearch.mockResolvedValue(results);
        // delay: null — no macrotask gaps for the debounce timer to fire into.
        const user = userEvent.setup({ delay: null });
        render(<HeaderSearch />);

        await user.type(searchInput(), 'onera');
        expect(await screen.findByRole('menu', { name: 'Search results' })).toBeInTheDocument();

        await user.clear(searchInput());
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('clearing during the debounce window cancels the pending search', async () => {
        mockSearch.mockResolvedValue(results);
        const user = userEvent.setup({ delay: null });
        render(<HeaderSearch />);

        await user.type(searchInput(), 'onera');
        await user.clear(searchInput());

        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(mockSearch).not.toHaveBeenCalled();
    });

    it('does not query the backend while the input is empty', async () => {
        mockSearch.mockResolvedValue(results);
        render(<HeaderSearch />);
        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(mockSearch).not.toHaveBeenCalled();
    });
});
