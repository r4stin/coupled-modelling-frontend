import { backendApi } from '@/services/backend/api';
import { HealthResponse } from '@/types/backend';

export const healthUrl = 'health/';

export const getHealth = () => backendApi.get(healthUrl).json<HealthResponse>();
