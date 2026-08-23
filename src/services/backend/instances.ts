import { backendApi } from '@/services/backend/api';
import { InstancePropertyMetadata } from '@/types/backend';

export const instancesUrl = 'get_instance_property_metadata/';

export const getInstancePropertyMetadata = (instance: string) =>
    backendApi.get(instancesUrl, { searchParams: { instance } }).json<InstancePropertyMetadata>();
