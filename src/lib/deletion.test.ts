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

    it('describes the loading and error states', () => {
        expect(deletionMessage('"X"', { status: 'loading' })).toBe('Checking what deleting instance "X" would remove…');
        expect(deletionMessage('"X"', { status: 'error' })).toBe(
            'Are you sure you want to permanently delete instance "X" and everything it contains from the knowledge base?',
        );
    });

    it('spells out the cascade scope, the kept instances, and the removed links', () => {
        expect(deletionMessage('"X"', preview(['x']))).toBe('Are you sure you want to permanently delete instance "X" from the knowledge base?');
        expect(deletionMessage('"X"', preview(['x', 'a'], ['s']))).toBe(
            'Are you sure you want to permanently delete instance "X" and the 1 instance it contains from the knowledge base? 1 instance linked below it is still reachable from elsewhere and will be kept.',
        );
        expect(deletionMessage('"X"', preview(['x'], ['s', 't'], ['p', 'q']))).toBe(
            'Are you sure you want to permanently delete instance "X" from the knowledge base? 2 instances linked below it are still reachable from elsewhere and will be kept. It is also linked from 2 other instances. Those links will be removed.',
        );
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

    it('asks a plain question for literals and while the unlink preview is pending or failed', () => {
        const question = 'Are you sure you want to delete solver "CFD"?';
        expect(unlinkMessage('solver', 'CFD', 'h', null)).toBe(question);
        expect(unlinkMessage('solver', 'CFD', 'h', { status: 'unsupported' })).toBe(question);
        expect(unlinkMessage('solver', 'CFD', 'h', { status: 'loading' })).toBe('Checking what deleting solver "CFD" would remove…');
        expect(unlinkMessage('solver', 'CFD', 'h', { status: 'error' })).toBe(
            `${question} If nothing else links to it, the linked instance and everything it contains will be deleted as well.`,
        );
    });

    it('spells out what unlinking collects, keeps, or leaves untouched', () => {
        const ready = (target: string | null, deleted: string[], kept: string[]) => ({
            status: 'ready' as const,
            preview: { target, deleted, kept },
        });
        const question = 'Are you sure you want to delete solver "CFD"?';
        expect(unlinkMessage('solver', 'CFD', 'h', ready('t', [], ['t']))).toBe(`${question} The linked instance stays in the knowledge base.`);
        expect(unlinkMessage('solver', 'CFD', 'h', ready('t', [], []))).toBe(`${question} Only the link is removed.`);
        expect(unlinkMessage('solver', 'CFD', 'h', ready('t', ['t'], []))).toBe(
            `${question} Nothing else links to the linked instance, so it will be deleted as well.`,
        );
        // The holder reached through a back-link is not counted among the kept instances.
        expect(unlinkMessage('solver', 'CFD', 'h', ready('t', ['t', 'a', 'b'], ['s', 'h']))).toBe(
            `${question} Nothing else links to the linked instance, so it will be deleted as well, together with the 2 instances it contains. 1 instance linked below it is still reachable from elsewhere and will be kept.`,
        );
    });
});
