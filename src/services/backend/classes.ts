import { backendApi } from '@/services/backend/api';
import { ClassHierarchyMetadata, ClassInstanceSummary, ClassMetadata, InstanceId } from '@/types/backend';

export const classesUrl = 'get_class_hierarchy_metadata/';
export const classInstanceSummariesUrl = 'get_class_instance_summaries/';
export const classMetadataUrl = 'get_class_metadata/';

export const getClassHierarchyMetadata = () => backendApi.get(classesUrl).json<ClassHierarchyMetadata>();

export const getClassInstanceSummaries = (className: string) =>
    backendApi.get(classInstanceSummariesUrl, { searchParams: { class: className } }).json<ClassInstanceSummary[]>();

export const getClassMetadata = (className: string) => backendApi.get(classMetadataUrl, { searchParams: { class: className } }).json<ClassMetadata>();

export const createClassInstance = (className: string, label: string) =>
    backendApi.post('create_class_instance/', { json: { class: className, label } }).json<InstanceId>();
