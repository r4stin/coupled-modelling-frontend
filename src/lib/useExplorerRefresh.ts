'use client';

import { useSWRConfig } from 'swr';

import { classInstanceSummariesUrl } from '@/services/backend/classes';
import { instancesUrl } from '@/services/backend/instances';

/**
 * Revalidation helpers for after mutations. Bound to the active SWR cache via
 * useSWRConfig, so they work with the app's global cache and the per-test caches alike.
 */
export const useExplorerRefresh = () => {
    const { mutate } = useSWRConfig();

    return {
        /** Refresh one instance's inspector data. */
        refreshInstance: (instanceId: string) => mutate([instancesUrl, instanceId]),
        /** Evict a deleted instance's cache entry so back-navigation cannot resurrect it. */
        purgeInstance: (instanceId: string) => mutate([instancesUrl, instanceId], undefined, { revalidate: false }),
        /** Refresh the instance lists of the given classes (previews change with value mutations). */
        refreshClassInstances: (classIds: string[]) =>
            Promise.all([...new Set(classIds)].map((classId) => mutate([classInstanceSummariesUrl, classId]))),
        /** Revalidate every cached backend resource (a Kratos import can touch any class, metadata, or instance). */
        refreshEverything: () => mutate(() => true),
    };
};
