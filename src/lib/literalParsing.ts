import { ScalarValue } from '@/types/backend';

const XSD = 'http://www.w3.org/2001/XMLSchema#';

export type ParsedLiteral = { ok: true; value: ScalarValue } | { ok: false; message: string };

/**
 * Parses the raw text of an inline edit according to the literal's datatype,
 * mirroring the validation rules the explorer has always applied.
 */
export const parseLiteralInput = (raw: string, datatype: string): ParsedLiteral => {
    const text = raw.trim();
    if (text === '') {
        return { ok: false, message: 'Value cannot be empty' };
    }
    if (datatype === `${XSD}integer`) {
        const parsed = Number.parseInt(text, 10);
        return Number.isNaN(parsed) ? { ok: false, message: 'Value must be a valid integer' } : { ok: true, value: parsed };
    }
    if (datatype === `${XSD}double` || datatype === `${XSD}decimal` || datatype === `${XSD}float`) {
        const parsed = Number.parseFloat(text);
        return Number.isNaN(parsed) ? { ok: false, message: 'Value must be a valid number' } : { ok: true, value: parsed };
    }
    if (datatype === `${XSD}boolean`) {
        return { ok: true, value: ['true', 'yes', '1'].includes(text.toLowerCase()) };
    }
    return { ok: true, value: text };
};

/** XSD datatype equivalent of each typed-input choice of the add-value form. */
const TYPE_DATATYPES = {
    integer: `${XSD}integer`,
    double: `${XSD}double`,
    boolean: `${XSD}boolean`,
} as const;

/** Input interpretation ids of the add-value form. */
export type ValueTypeId = 'string' | 'object' | keyof typeof TYPE_DATATYPES;

/**
 * Parses the raw text of the add-value form according to the chosen value type.
 * Typed literals share parseLiteralInput's rules, so the add form and the inline
 * editor can never diverge on what counts as a valid value.
 */
export const parseTypedValueInput = (raw: string, type: ValueTypeId): ParsedLiteral => {
    const text = raw.trim();
    if (text === '') {
        return { ok: false, message: 'Please enter a value' };
    }
    if (type === 'object') {
        return text.startsWith('instance')
            ? { ok: true, value: text }
            : { ok: false, message: 'Linked object ID must start with "instance" (e.g. instance_24)' };
    }
    if (type === 'string') {
        return { ok: true, value: text };
    }
    return parseLiteralInput(text, TYPE_DATATYPES[type]);
};
