import { backendApi } from '@/services/backend/api';
import { HealthResponse } from '@/types/backend';

export const healthUrl = 'health/';

// The health route reports GraphDB-down as HTTP 503 with a HealthError body;
// disable ky's throw-on-status here so that state reaches the UI as data
// (a thrown error then means the backend itself is unreachable).
export const getHealth = () => backendApi.get(healthUrl, { throwHttpErrors: false }).json<HealthResponse>();
