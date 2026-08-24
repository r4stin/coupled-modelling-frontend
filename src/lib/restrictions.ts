import { Restriction } from '@/types/backend';

const KIND_LABELS: Record<Restriction['kind'], string> = {
    some_values_from: 'some',
    all_values_from: 'all',
    has_value: 'value',
    cardinality: 'exactly',
    qualified_cardinality: 'exactly',
    min_cardinality: 'min',
    min_qualified_cardinality: 'min',
    max_cardinality: 'max',
    max_qualified_cardinality: 'max',
};

/**
 * Human-readable quantifier word for an OWL restriction kind (e.g. `has_data some data_1`).
 * A kind the spec does not know yet (backend ahead of the regenerated types) degrades to the raw kind.
 */
export const restrictionKindLabel = (kind: Restriction['kind']): string => KIND_LABELS[kind] ?? kind;
