import { describe, expect, it } from 'vitest';

import {
    containedCount,
    deletionMessage,
    normalizeDeletionPreview,
    normalizeUnlinkResult,
    plural,
    toPreviewState,
    unlinkMessage,
} from '@/lib/deletion';

const preview = (deleted: string[], kept: string[] = [], unlinkedFrom: string[] = []) => ({
    status: 'ready' as const,
    preview: { instance: 'x', deleted, kept, unlinked_from: unlinkedFrom },
});

describe('deletion helpers', () => {
    it('pluralizes counts', () => {
        expect(plural(1, 'instance')).toBe('1 instance');
        expect(plural(2, 'instance')).toBe('2 instances');
        expect(plural(0, 'instance')).toBe('0 instances');
    });

    it('fills in fields an older backend omits instead of crashing on them', () => {
        expect(normalizeDeletionPreview('x', { instance: 'x', deleted: ['x', 'a'], kept: ['s'] })).toEqual({
            instance: 'x',
            deleted: ['x', 'a'],
            kept: ['s'],
            unlinked_from: [],
        });
        expect(normalizeDeletionPreview('x', { status: 'success', instance: 'x' } as never)).toEqual({
            instance: 'x',
            deleted: ['x'],
            kept: [],
            unlinked_from: [],
        });
        expect(normalizeDeletionPreview('x', undefined)).toEqual({ instance: 'x', deleted: ['x'], kept: [], unlinked_from: [] });
        expect(() => deletionMessage('"X"', { status: 'ready', preview: normalizeDeletionPreview('x', { deleted: ['x'] }) })).not.toThrow();
    });

    it('counts contained instances by id, regardless of order', () => {
        expect(containedCount('x', ['x', 'a', 'b'])).toBe(2);
        expect(containedCount('x', ['a', 'x'])).toBe(1);
        expect(containedCount('x', ['x'])).toBe(0);
        expect(containedCount(null, [])).toBe(0);
    });

    it('describes the loading and error states without claiming a scope it does not know', () => {
        expect(deletionMessage('"X"', { status: 'loading' })).toEqual({ text: 'Checking what deleting "X" would remove…', consequences: [] });
        expect(deletionMessage('"X"', { status: 'error' })).toEqual({
            text: 'Permanently delete "X"?',
            consequences: ['What it contains could not be checked; everything it contains will be deleted with it.'],
        });
    });

    it('lists the cascade scope, the kept instances, and the removed links one per line, omitting zero counts', () => {
        expect(deletionMessage('"X"', preview(['x']))).toEqual({ text: 'Permanently delete "X"?', consequences: [] });
        expect(deletionMessage('"X"', preview(['x', 'a'], ['s']))).toEqual({
            text: 'Permanently delete "X" and everything it contains?',
            consequences: ['1 contained instance will be deleted with it.', '1 instance below it stays, since it is still used elsewhere.'],
        });
        expect(deletionMessage('"X"', preview(['x', 'a', 'b'], ['s', 't'], ['p', 'q']))).toEqual({
            text: 'Permanently delete "X" and everything it contains?',
            consequences: [
                '2 contained instances will be deleted with it.',
                '2 instances below it stay, since they are still used elsewhere.',
                'Links from 2 other instances will be removed.',
            ],
        });
        // Kept or linking instances alone never add the "everything it contains" scope.
        expect(deletionMessage('"X"', preview(['x'], ['s', 't'], ['p']))).toEqual({
            text: 'Permanently delete "X"?',
            consequences: ['2 instances below it stay, since they are still used elsewhere.', '1 link from another instance will be removed.'],
        });
    });

    it('fills in an unlink result an older backend leaves empty', () => {
        expect(normalizeUnlinkResult({ target: 't', deleted: ['t', 'a'], kept: ['s'] })).toEqual({ target: 't', deleted: ['t', 'a'], kept: ['s'] });
        expect(normalizeUnlinkResult('' as never)).toEqual({ target: null, deleted: [], kept: [] });
        expect(normalizeUnlinkResult(undefined)).toEqual({ target: null, deleted: [], kept: [] });
    });

    it('folds an SWR result into the dialog state', () => {
        const isRefusal = (error: unknown) => error === 'refused';
        expect(toPreviewState({ a: 1 }, undefined, isRefusal)).toEqual({ status: 'ready', preview: { a: 1 } });
        expect(toPreviewState(undefined, new Error('down'), isRefusal)).toEqual({ status: 'error' });
        expect(toPreviewState(undefined, 'refused', isRefusal)).toEqual({ status: 'loading' });
        expect(toPreviewState(undefined, undefined, isRefusal)).toEqual({ status: 'loading' });
    });

    it('asks a plain question for literals and while the unlink preview is pending, unsupported, or failed', () => {
        const question = 'Permanently delete solver "CFD"?';
        expect(unlinkMessage('solver', 'CFD', 'h', null)).toEqual({ text: question, consequences: [] });
        expect(unlinkMessage('solver', 'CFD', 'h', { status: 'unsupported' })).toEqual({ text: question, consequences: [] });
        expect(unlinkMessage('solver', 'CFD', 'h', { status: 'loading' })).toEqual({
            text: 'Checking what deleting solver "CFD" would remove…',
            consequences: [],
        });
        expect(unlinkMessage('solver', 'CFD', 'h', { status: 'error' })).toEqual({
            text: question,
            consequences: [
                'What it links to could not be checked; if nothing else links to it, the linked instance and everything it contains will be deleted as well.',
            ],
        });
    });

    it('lists what unlinking collects, keeps, or leaves untouched', () => {
        const ready = (target: string | null, deleted: string[], kept: string[]) => ({
            status: 'ready' as const,
            preview: { target, deleted, kept },
        });
        const question = 'Permanently delete solver "CFD"?';
        expect(unlinkMessage('solver', 'CFD', 'h', ready('t', [], ['t']))).toEqual({
            text: question,
            consequences: ['The linked instance itself is kept; only the link will be removed.'],
        });
        expect(unlinkMessage('solver', 'CFD', 'h', ready('t', [], []))).toEqual({ text: question, consequences: ['Only the link will be removed.'] });
        expect(unlinkMessage('solver', 'CFD', 'h', ready('t', ['t'], []))).toEqual({
            text: question,
            consequences: ['Nothing else links to the linked instance, so it will be deleted as well.'],
        });
        // The holder reached through a back-link is not counted among the kept instances.
        expect(unlinkMessage('solver', 'CFD', 'h', ready('t', ['t', 'a', 'b'], ['s', 'h']))).toEqual({
            text: question,
            consequences: [
                'Nothing else links to the linked instance, so it will be deleted as well.',
                '2 contained instances will be deleted with it.',
                '1 instance below it stays, since it is still used elsewhere.',
            ],
        });
    });
});
