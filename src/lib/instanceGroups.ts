import { ClassInstanceSummary } from '@/types/backend';

export type InstanceGroup = {
    type: string;
    instances: ClassInstanceSummary[];
};

/** The group names an instance is listed under: its direct types, or the fallback (selected class) when untyped. */
const effectiveTypes = (summary: ClassInstanceSummary, fallbackType: string) =>
    summary.types.length > 0 ? new Set(summary.types) : new Set([fallbackType]);

/**
 * Groups instance summaries by their direct types, sorted alphabetically by type.
 *
 * - An instance with several types appears in each of those groups.
 * - An instance without types falls back to the given group (the selected class).
 * - Order within a group follows the input order (the backend sorts by label).
 */
export const groupInstancesByType = (summaries: ClassInstanceSummary[], fallbackType: string): InstanceGroup[] => {
    const groups = new Map<string, ClassInstanceSummary[]>();
    for (const summary of summaries) {
        for (const type of effectiveTypes(summary, fallbackType)) {
            const members = groups.get(type);
            if (members) {
                members.push(summary);
            } else {
                groups.set(type, [summary]);
            }
        }
    }
    return [...groups.entries()].map(([type, instances]) => ({ type, instances })).sort((a, b) => a.type.localeCompare(b.type));
};

/** Case-insensitive filter over label, id, and the group names the instance is displayed under. */
export const filterInstances = (summaries: ClassInstanceSummary[], query: string, fallbackType: string): ClassInstanceSummary[] => {
    const needle = query.toLowerCase().trim();
    if (!needle) {
        return summaries;
    }
    return summaries.filter(
        (summary) =>
            summary.label.toLowerCase().includes(needle) ||
            summary.id.toLowerCase().includes(needle) ||
            [...effectiveTypes(summary, fallbackType)].some((type) => type.toLowerCase().includes(needle)),
    );
};
