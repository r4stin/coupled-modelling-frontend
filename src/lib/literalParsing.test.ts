import { describe, expect, it } from 'vitest';

import { parseLiteralInput } from '@/lib/literalParsing';

const XSD = 'http://www.w3.org/2001/XMLSchema#';

describe('parseLiteralInput', () => {
    it('rejects empty input', () => {
        expect(parseLiteralInput('   ', `${XSD}string`)).toEqual({ ok: false, message: 'Value cannot be empty' });
    });

    it('parses integers and rejects non-integers', () => {
        expect(parseLiteralInput(' 42 ', `${XSD}integer`)).toEqual({ ok: true, value: 42 });
        expect(parseLiteralInput('-7', `${XSD}integer`)).toEqual({ ok: true, value: -7 });
        expect(parseLiteralInput('abc', `${XSD}integer`)).toEqual({ ok: false, message: 'Value must be a valid integer' });
        // No silent truncation: partial parses are rejected.
        expect(parseLiteralInput('4.7', `${XSD}integer`)).toEqual({ ok: false, message: 'Value must be a valid integer' });
        expect(parseLiteralInput('4abc', `${XSD}integer`)).toEqual({ ok: false, message: 'Value must be a valid integer' });
    });

    it('parses doubles, decimals, and floats, rejecting partial numbers', () => {
        expect(parseLiteralInput('1.5', `${XSD}double`)).toEqual({ ok: true, value: 1.5 });
        expect(parseLiteralInput('2.25', `${XSD}decimal`)).toEqual({ ok: true, value: 2.25 });
        expect(parseLiteralInput('0.5', `${XSD}float`)).toEqual({ ok: true, value: 0.5 });
        expect(parseLiteralInput('1e3', `${XSD}double`)).toEqual({ ok: true, value: 1000 });
        expect(parseLiteralInput('abc', `${XSD}double`)).toEqual({ ok: false, message: 'Value must be a valid number' });
        expect(parseLiteralInput('1.5abc', `${XSD}double`)).toEqual({ ok: false, message: 'Value must be a valid number' });
        // JS-only numeric spellings are outside the XSD lexical space.
        expect(parseLiteralInput('0x10', `${XSD}double`)).toEqual({ ok: false, message: 'Value must be a valid number' });
    });

    it('parses only the true/false spellings as booleans', () => {
        expect(parseLiteralInput('TRUE', `${XSD}boolean`)).toEqual({ ok: true, value: true });
        expect(parseLiteralInput('false', `${XSD}boolean`)).toEqual({ ok: true, value: false });
        // Everything else is rejected, never coerced — the UI offers a select,
        // so free-text spellings have no entry point.
        expect(parseLiteralInput('yes', `${XSD}boolean`)).toEqual({ ok: false, message: 'Value must be true or false' });
        expect(parseLiteralInput('OpenMP', `${XSD}boolean`)).toEqual({ ok: false, message: 'Value must be true or false' });
    });

    it('passes strings through trimmed', () => {
        expect(parseLiteralInput('  OpenMP  ', `${XSD}string`)).toEqual({ ok: true, value: 'OpenMP' });
    });
});
