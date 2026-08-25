'use client';

import useSWR from 'swr';

import { classesUrl, getClassHierarchyMetadata } from '@/services/backend/classes';

/** The class hierarchy under its one shared cache key, for every consumer. */
export const useClassHierarchy = () => useSWR(classesUrl, getClassHierarchyMetadata);
