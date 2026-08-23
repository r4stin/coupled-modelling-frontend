import { backendApi } from '@/services/backend/api';
import { InstancePropertyMetadata } from '@/types/backend';

export const instancesUrl = 'get_instance_property_metadata/';

export const getInstancePropertyMetadata = (instance: string) =>
    backendApi.get(instancesUrl, { searchParams: { instance } }).json<InstancePropertyMetadata>();

// Mutations (add/delete/replace values, create/delete instance, import/export)
// will be added during the Phase 1 write-workflow port (plan task 1.3).
