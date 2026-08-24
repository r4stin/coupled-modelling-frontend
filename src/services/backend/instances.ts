import { backendApi } from '@/services/backend/api';
import { DeleteValueTarget, InstancePropertyMetadata, PropertyDataMap } from '@/types/backend';

export const instancesUrl = 'get_instance_property_metadata/';

export const getInstancePropertyMetadata = (instance: string) =>
    backendApi.get(instancesUrl, { searchParams: { instance } }).json<InstancePropertyMetadata>();

export const deleteValue = (instance: string, property: string, value: DeleteValueTarget) =>
    backendApi.post('delete_value/', { json: { instance, property, value } });

export const deleteInstance = (instance: string) => backendApi.post('delete_instance/', { json: { instance } });

export const addValues = (instance: string, data: PropertyDataMap) => backendApi.post('add_values/', { json: { instance, data } });

export const replaceValue = (instance: string, property: string, oldValue: DeleteValueTarget, newValue: DeleteValueTarget) =>
    backendApi.post('replace_value/', { json: { instance, property, old_value: oldValue, new_value: newValue } });
