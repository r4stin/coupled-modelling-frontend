'use client';

import { useSWRConfig } from 'swr';

import { classInstanceSummariesUrl } from '@/services/backend/classes';
import { deletionPreviewUrl, instancesUrl } from '@/services/backend/instances';
import { searchUrl } from '@/services/backend/search';
import { ClassInstanceSummary } from '@/types/backend';

const isKeyOf = (key: unknown, url: string): key is [string, ...unknown[]] => Array.isArray(key) && key[0] === url;

/**
 * Revalidation helpers for after mutations. Bound to the active SWR cache via
 * useSWRConfig, so they work with the app's global cache and the per-test caches alike.
 */
export const useExplorerRefresh = () => {
    const { mutate } = useSWRConfig();

    // Cached search results go stale on any mutation; evict the whole key family.
    const purgeSearches = () => mutate((key) => isKeyOf(key, searchUrl), undefined, { revalidate: false });

    return {
        /** Refresh one instance's inspector data. */
        refreshInstance: (instanceId: string) => Promise.all([mutate([instancesUrl, instanceId]), purgeSearches()]),
        /**
         * After a deletion: evict the deleted instances (and the instances that lost a
         * link to them) so back-navigation cannot resurrect stale data, drop the deleted
         * rows from every cached instance list, and reload the lists on screen.
         */
        purgeDeletedInstances: (deletedIds: string[], unlinkedIds: string[] = []) => {
            const gone = new Set([...deletedIds, ...unlinkedIds]);
            const deleted = new Set(deletedIds);
            return Promise.all([
                mutate((key) => (isKeyOf(key, instancesUrl) || isKeyOf(key, deletionPreviewUrl)) && gone.has(key[1] as string), undefined, {
                    revalidate: false,
                }),
                mutate(
                    (key) => isKeyOf(key, classInstanceSummariesUrl),
                    (list?: ClassInstanceSummary[]) => list?.filter((summary) => !deleted.has(summary.id)),
                    { revalidate: true },
                ),
                purgeSearches(),
            ]);
        },
        /** Refresh the instance lists of the given classes (previews change with value mutations). */
        refreshClassInstances: (classIds: string[]) =>
            Promise.all([...[...new Set(classIds)].map((classId) => mutate([classInstanceSummariesUrl, classId])), purgeSearches()]),
        /** Revalidate every cached backend resource (a Kratos import can touch any class, metadata, or instance). */
        refreshEverything: () => mutate(() => true),
    };
};
