import ky from 'ky';

/**
 * HTTP client for the coupled_modelling Flask backend.
 * All backend calls go through service files in src/services/backend/,
 * one file per resource type.
 *
 * Note: Flask routes end with a trailing slash (e.g. `health/`).
 */
export const backendApi = ky.create({
    prefixUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1.0',
    timeout: 30000,
});
