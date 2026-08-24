import { DeleteValueTarget, InstancePropertyGroup } from '@/types/backend';

/**
 * The exact-triple target the delete endpoint needs, language tag included.
 * Single definition shared by every mutation that must address a stored value.
 */
export const toDeleteTarget = (value: InstancePropertyGroup['values'][number]): DeleteValueTarget =>
    value.kind === 'object'
        ? { kind: 'object', id: value.id }
        : { kind: 'literal', value: value.value, datatype: value.datatype, ...(value.language ? { language: value.language } : {}) };
