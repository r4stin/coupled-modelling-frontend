import { backendApi } from '@/services/backend/api';
import { SearchResults, SearchType } from '@/types/backend';

export const searchUrl = 'search/';

// Enough for a dropdown; keeps the per-keystroke preview queries small.
const SEARCH_LIMIT = 10;

// No retries: stale typeahead responses are superseded by the next keystroke,
// and retrying against a down backend multiplies requests per keystroke.
const searchApi = backendApi.extend({ retry: 0 });

export const searchEntities = (text: string, type: SearchType = 'all') =>
    searchApi.get(searchUrl, { searchParams: { q: text, type, limit: SEARCH_LIMIT } }).json<SearchResults>();
