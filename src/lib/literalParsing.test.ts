import { describe, expect, it } from 'vitest';

import { parseLiteralInput } from '@/lib/literalParsing';

const XSD = 'http://www.w3.org/2001/XMLSchema#';

describe('parseLiteralInput', () => {
    it('rejects empty input', () => {
        expect(parseLiteralInput('   ', `${XSD}string`)).toEqual({ ok: false, message: 'Value cannot be empty' });
    });

    it('parses integers and rejects non-numbers', () => {
        expect(parseLiteralInput(' 42 ', `${XSD}integer`)).toEqual({ ok: true, value: 42 });
        expect(parseLiteralInput('abc', `${XSD}integer`)).toEqual({ ok: false, message: 'Value must be a valid integer' });
    });

    it('parses doubles, decimals, and floats', () => {
        expect(parseLiteralInput('1.5', `${XSD}double`)).toEqual({ ok: true, value: 1.5 });
        expect(parseLiteralInput('2.25', `${XSD}decimal`)).toEqual({ ok: true, value: 2.25 });
        expect(parseLiteralInput('0.5', `${XSD}float`)).toEqual({ ok: true, value: 0.5 });
        expect(parseLiteralInput('abc', `${XSD}double`)).toEqual({ ok: false, message: 'Value must be a valid number' });
    });

    it('parses booleans from the accepted truthy spellings', () => {
        expect(parseLiteralInput('TRUE', `${XSD}boolean`)).toEqual({ ok: true, value: true });
        expect(parseLiteralInput('yes', `${XSD}boolean`)).toEqual({ ok: true, value: true });
        expect(parseLiteralInput('no', `${XSD}boolean`)).toEqual({ ok: true, value: false });
    });

    it('passes strings through trimmed', () => {
        expect(parseLiteralInput('  OpenMP  ', `${XSD}string`)).toEqual({ ok: true, value: 'OpenMP' });
    });
});
