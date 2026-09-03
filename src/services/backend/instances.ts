import { normalizeDeletionPreview } from '@/lib/deletion';
import { backendApi } from '@/services/backend/api';
import {
    DeleteInstanceResult,
    DeleteValueTarget,
    InstanceDeletionPreview,
    InstanceId,
    InstancePropertyMetadata,
    PropertyDataMap,
} from '@/types/backend';

export const instancesUrl = 'get_instance_property_metadata/';
export const deletionPreviewUrl = 'get_instance_deletion_preview/';

export const getInstancePropertyMetadata = (instance: string) =>
    backendApi.get(instancesUrl, { searchParams: { instance } }).json<InstancePropertyMetadata>();

export const getInstanceDeletionPreview = (instance: string) =>
    backendApi
        .get(deletionPreviewUrl, { searchParams: { instance } })
        .json<InstanceDeletionPreview>()
        .then((preview) => normalizeDeletionPreview(instance, preview));

export const deleteValue = (instance: string, property: string, value: DeleteValueTarget) =>
    backendApi.post('delete_value/', { json: { instance, property, value } });

/** Deletes the instance together with its owned subtree. */
export const deleteInstance = (instance: string): Promise<DeleteInstanceResult> =>
    backendApi
        .post('delete_instance/', { json: { instance, cascade: true } })
        .json<DeleteInstanceResult>()
        .then((result) => ({ status: 'success', ...normalizeDeletionPreview(instance, result) }));

export const addValues = (instance: string, data: PropertyDataMap) => backendApi.post('add_values/', { json: { instance, data } });

export const replaceValue = (instance: string, property: string, oldValue: DeleteValueTarget, newValue: DeleteValueTarget) =>
    backendApi.post('replace_value/', { json: { instance, property, old_value: oldValue, new_value: newValue } });

export const createInstance = (property: string, parent: string, data: PropertyDataMap) =>
    backendApi.post('create_instance/', { json: { property, parent, data } }).json<InstanceId>();
