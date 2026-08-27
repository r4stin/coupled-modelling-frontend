import { ScalarValue } from '@/types/backend';

const XSD = 'http://www.w3.org/2001/XMLSchema#';

export const XSD_BOOLEAN = `${XSD}boolean`;

const INTEGER_PATTERN = /^[+-]?\d+$/;
// The XSD decimal lexical space: no hex/binary/octal spellings, which Number()
// would otherwise accept ("0x10" is not 16 here).
const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

/** The two boolean spellings; every boolean input is a pick, never free text. */
export const BOOLEAN_OPTIONS = [
    { id: 'true', label: 'true' },
    { id: 'false', label: 'false' },
];

export type ParsedLiteral = { ok: true; value: ScalarValue } | { ok: false; message: string };

/**
 * Parses the raw text of an inline edit according to the literal's datatype.
 * Partial numeric text ("4.7" or "4abc" as integer, "1.5abc" as double) and
 * non-boolean text are rejected rather than coerced.
 */
export const parseLiteralInput = (raw: string, datatype: string): ParsedLiteral => {
    const text = raw.trim();
    if (text === '') {
        return { ok: false, message: 'Value cannot be empty' };
    }
    if (datatype === `${XSD}integer`) {
        return INTEGER_PATTERN.test(text) ? { ok: true, value: Number.parseInt(text, 10) } : { ok: false, message: 'Value must be a valid integer' };
    }
    if (datatype === `${XSD}double` || datatype === `${XSD}decimal` || datatype === `${XSD}float`) {
        return DECIMAL_PATTERN.test(text) ? { ok: true, value: Number(text) } : { ok: false, message: 'Value must be a valid number' };
    }
    if (datatype === XSD_BOOLEAN) {
        const lowered = text.toLowerCase();
        if (lowered === 'true' || lowered === 'false') {
            return { ok: true, value: lowered === 'true' };
        }
        return { ok: false, message: 'Value must be true or false' };
    }
    return { ok: true, value: text };
};

/** XSD datatype equivalent of each typed-input choice of the add-value form. */
const TYPE_DATATYPES = {
    integer: `${XSD}integer`,
    double: `${XSD}double`,
    boolean: XSD_BOOLEAN,
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
