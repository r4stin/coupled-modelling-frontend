import { normalizeDeletionPreview, normalizeUnlinkResult } from '@/lib/deletion';
import { backendApi } from '@/services/backend/api';
import {
    DeleteInstanceResult,
    DeleteValueResult,
    DeleteValueTarget,
    InstanceDeletionPreview,
    InstanceId,
    InstancePropertyMetadata,
    PropertyDataMap,
    UnlinkResult,
} from '@/types/backend';

export const instancesUrl = 'get_instance_property_metadata/';
export const deletionPreviewUrl = 'get_instance_deletion_preview/';
export const valueDeletionPreviewUrl = 'get_value_deletion_preview/';

export const getInstancePropertyMetadata = (instance: string) =>
    backendApi.get(instancesUrl, { searchParams: { instance } }).json<InstancePropertyMetadata>();

export const getInstanceDeletionPreview = (instance: string) =>
    backendApi
        .get(deletionPreviewUrl, { searchParams: { instance } })
        .json<InstanceDeletionPreview>()
        .then((preview) => normalizeDeletionPreview(instance, preview));

export const getValueDeletionPreview = (instance: string, property: string, target: string) =>
    backendApi.get(valueDeletionPreviewUrl, { searchParams: { instance, property, target } }).json<UnlinkResult>().then(normalizeUnlinkResult);

/** Deletes the value; an unlinked instance goes with its owned subtree when nothing else reaches it. */
export const deleteValue = (instance: string, property: string, value: DeleteValueTarget): Promise<DeleteValueResult> =>
    backendApi
        .post('delete_value/', { json: { instance, property, value, cascade: true } })
        .json<DeleteValueResult>()
        .then((result) => ({ status: 'success', ...normalizeUnlinkResult(result) }));

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
