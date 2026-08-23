import { describe, expect, it } from 'vitest';

import { buildClassTree, findPathsToClass } from '@/lib/classTree';

describe('buildClassTree', () => {
    it('nests classes under their parents and sorts alphabetically', () => {
        const tree = buildClassTree([
            { class: 'solvers', parents: [] },
            { class: 'data', parents: [] },
            { class: 'fluid_solver', parents: ['solvers'] },
            { class: 'structure_solver', parents: ['solvers'] },
        ]);
        expect(tree.map((node) => node.name)).toEqual(['data', 'solvers']);
        expect(tree[1].children.map((node) => node.name)).toEqual(['fluid_solver', 'structure_solver']);
    });

    it('treats classes with only out-of-namespace parents as roots', () => {
        const tree = buildClassTree([{ class: 'coupled_system', parents: ['Thing'] }]);
        expect(tree.map((node) => node.name)).toEqual(['coupled_system']);
    });

    it('shows a multi-parent class under each parent', () => {
        const tree = buildClassTree([
            { class: 'a', parents: [] },
            { class: 'b', parents: [] },
            { class: 'shared', parents: ['a', 'b'] },
        ]);
        expect(tree[0].children.map((node) => node.name)).toEqual(['shared']);
        expect(tree[1].children.map((node) => node.name)).toEqual(['shared']);
    });

    it('surfaces cycle members instead of dropping them', () => {
        const tree = buildClassTree([
            { class: 'x', parents: ['y'] },
            { class: 'y', parents: ['x'] },
        ]);
        // No root exists, so the first cycle member is surfaced at top level with the cycle cut below it.
        expect(tree.map((node) => node.name)).toEqual(['x']);
        expect(tree[0].children.map((node) => node.name)).toEqual(['y']);
        expect(tree[0].children[0].children).toEqual([]);
    });

    it('ignores duplicate rows, duplicate parents, and self-parent edges', () => {
        const tree = buildClassTree([
            { class: 'a', parents: [] },
            { class: 'a', parents: [] },
            { class: 'child', parents: ['a', 'a'] },
            { class: 'weird', parents: ['weird'] },
        ]);
        expect(tree.map((node) => node.name)).toEqual(['a', 'weird']);
        expect(tree[0].children.map((node) => node.name)).toEqual(['child']);
    });

    it('sorts every level with the same locale-aware ordering', () => {
        const tree = buildClassTree([
            { class: 'root', parents: [] },
            { class: 'Zeta', parents: ['root'] },
            { class: 'alpha', parents: ['root'] },
        ]);
        expect(tree[0].children.map((node) => node.name)).toEqual(['alpha', 'Zeta']);
    });

    it('shares the subtree object between parents instead of rebuilding it', () => {
        const tree = buildClassTree([
            { class: 'a', parents: [] },
            { class: 'b', parents: [] },
            { class: 'shared', parents: ['a', 'b'] },
            { class: 'leaf', parents: ['shared'] },
        ]);
        expect(tree[0].children[0]).toBe(tree[1].children[0]);
    });

    it('returns an empty tree for an empty hierarchy', () => {
        expect(buildClassTree([])).toEqual([]);
    });
});

describe('findPathsToClass', () => {
    it('returns every occurrence path of a multi-parent class', () => {
        const tree = buildClassTree([
            { class: 'a', parents: [] },
            { class: 'b', parents: [] },
            { class: 'shared', parents: ['a', 'b'] },
        ]);
        expect(findPathsToClass(tree, 'shared')).toEqual([
            ['a', 'shared'],
            ['b', 'shared'],
        ]);
        expect(findPathsToClass(tree, 'missing')).toEqual([]);
    });
});
