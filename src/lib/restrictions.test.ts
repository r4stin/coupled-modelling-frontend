import { describe, expect, it } from 'vitest';

import { restrictionKindLabel } from '@/lib/restrictions';
import { Restriction } from '@/types/backend';

describe('restrictionKindLabel', () => {
    it('maps every known kind to its quantifier word', () => {
        expect(restrictionKindLabel('some_values_from')).toBe('some');
        expect(restrictionKindLabel('all_values_from')).toBe('all');
        expect(restrictionKindLabel('has_value')).toBe('value');
        expect(restrictionKindLabel('qualified_cardinality')).toBe('exactly');
        expect(restrictionKindLabel('min_cardinality')).toBe('min');
        expect(restrictionKindLabel('max_qualified_cardinality')).toBe('max');
    });

    it('degrades to the raw kind for values the generated types do not know yet', () => {
        expect(restrictionKindLabel('has_self' as Restriction['kind'])).toBe('has_self');
    });
});
