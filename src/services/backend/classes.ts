import { backendApi } from '@/services/backend/api';
import { ClassHierarchyMetadata, ClassInstanceSummary, ClassMetadata } from '@/types/backend';

export const classesUrl = 'get_class_hierarchy_metadata/';

export const getClassHierarchyMetadata = () => backendApi.get(classesUrl).json<ClassHierarchyMetadata>();

export const getClassInstanceSummaries = (className: string) =>
    backendApi.get('get_class_instance_summaries/', { searchParams: { class: className } }).json<ClassInstanceSummary[]>();

export const getClassMetadata = (className: string) => backendApi.get('get_class_metadata/', { searchParams: { class: className } }).json<ClassMetadata>();
