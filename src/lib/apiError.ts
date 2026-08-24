import { HTTPError } from 'ky';

/** Extracts the backend's `{"error": "..."}` message from a failed request, with a generic fallback. */
export const getApiErrorMessage = async (error: unknown, fallback: string): Promise<string> => {
    if (error instanceof HTTPError) {
        try {
            const body = (await error.response.clone().json()) as { error?: string };
            if (body.error) {
                return body.error;
            }
        } catch {
            // Non-JSON error body — fall through to the fallback.
        }
    }
    return error instanceof Error && error.message ? error.message : fallback;
};
