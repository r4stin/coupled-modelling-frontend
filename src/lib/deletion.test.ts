import { describe, expect, it } from 'vitest';

import { containedCount, deletionMessage, normalizeDeletionPreview, plural } from '@/lib/deletion';

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
        expect(containedCount({ instance: 'x', deleted: ['x', 'a', 'b'] })).toBe(2);
        expect(containedCount({ instance: 'x', deleted: ['a', 'x'] })).toBe(1);
        expect(containedCount({ instance: 'x', deleted: ['x'] })).toBe(0);
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
});
