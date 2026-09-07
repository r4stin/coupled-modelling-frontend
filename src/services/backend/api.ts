import ky from 'ky';

/**
 * HTTP client for the coupled_modelling backend.
 * All backend calls go through service files in src/services/backend/,
 * one file per resource type.
 *
 * Note: backend routes end with a trailing slash (e.g. `health/`); a slash-less path is only redirected.
 */
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1.0').replace(/\/+$/, '');

export const backendApi = ky.create({
    prefixUrl: apiBaseUrl,
    timeout: 30000,
});

/**
 * Client for endpoints that run the backend's in-memory Owlready2 path
 * (full ontology reload plus inference), which can exceed the default timeout.
 */
export const longRunningBackendApi = backendApi.extend({ timeout: 120_000 });
