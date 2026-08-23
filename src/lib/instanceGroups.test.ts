import { describe, expect, it } from 'vitest';

import { filterInstances, groupInstancesByType } from '@/lib/instanceGroups';
import { ClassInstanceSummary } from '@/types/backend';

const summary = (id: string, label: string, types: string[]): ClassInstanceSummary => ({
    id,
    label,
    types,
    property_preview: [],
    preview_truncated: false,
});

describe('groupInstancesByType', () => {
    it('groups by type, sorted alphabetically, keeping input order within groups', () => {
        const groups = groupInstancesByType(
            [summary('i1', 'B solver', ['solvers']), summary('i2', 'A data', ['data']), summary('i3', 'C solver', ['solvers'])],
            'fallback',
        );
        expect(groups.map((group) => group.type)).toEqual(['data', 'solvers']);
        expect(groups[1].instances.map((instance) => instance.id)).toEqual(['i1', 'i3']);
    });

    it('lists a multi-type instance in each of its groups, deduplicated within a group', () => {
        const groups = groupInstancesByType([summary('i1', 'X', ['a', 'b', 'a'])], 'fallback');
        expect(groups.map((group) => group.type)).toEqual(['a', 'b']);
        expect(groups[0].instances).toHaveLength(1);
    });

    it('puts instances without types in the fallback group', () => {
        const groups = groupInstancesByType([summary('i1', 'X', [])], 'solvers');
        expect(groups).toEqual([{ type: 'solvers', instances: [expect.objectContaining({ id: 'i1' })] }]);
    });
});

describe('filterInstances', () => {
    const all = [summary('instance_1', 'Fluid solver', ['solvers']), summary('instance_2', 'Wing mesh', ['data'])];

    it('matches label, id, and type names case-insensitively', () => {
        expect(filterInstances(all, 'FLUID', 'fallback')).toHaveLength(1);
        expect(filterInstances(all, 'instance_2', 'fallback')).toHaveLength(1);
        expect(filterInstances(all, 'solv', 'fallback')).toHaveLength(1);
    });

    it('matches an untyped instance by the fallback group it is displayed under', () => {
        const untyped = [summary('instance_3', 'Legacy run', [])];
        expect(filterInstances(untyped, 'solvers', 'solvers')).toHaveLength(1);
        expect(filterInstances(untyped, 'data', 'solvers')).toHaveLength(0);
    });

    it('returns everything for a blank query', () => {
        expect(filterInstances(all, '  ', 'fallback')).toHaveLength(2);
    });
});
