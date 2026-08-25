import { describe, expect, it } from 'vitest';

import { buildClassTree, buildParentsIndex, findPathsToClass, isSubclassOf } from '@/lib/classTree';

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

describe('isSubclassOf', () => {
    const parentsOf = buildParentsIndex([
        { class: 'coupled_system', parents: [] },
        { class: 'fsi_system', parents: ['coupled_system'] },
        { class: 'special_fsi', parents: ['fsi_system'] },
        { class: 'solvers', parents: [] },
    ]);

    it('accepts the ancestor itself and transitive descendants', () => {
        expect(isSubclassOf(parentsOf, 'coupled_system', 'coupled_system')).toBe(true);
        expect(isSubclassOf(parentsOf, 'fsi_system', 'coupled_system')).toBe(true);
        expect(isSubclassOf(parentsOf, 'special_fsi', 'coupled_system')).toBe(true);
    });

    it('rejects unrelated and unknown classes', () => {
        expect(isSubclassOf(parentsOf, 'solvers', 'coupled_system')).toBe(false);
        expect(isSubclassOf(parentsOf, 'unknown', 'coupled_system')).toBe(false);
        expect(isSubclassOf(parentsOf, 'coupled_system', 'fsi_system')).toBe(false);
    });

    it('merges the parents of duplicate hierarchy rows', () => {
        const duplicated = buildParentsIndex([
            { class: 'fsi_system', parents: ['coupled_system'] },
            { class: 'fsi_system', parents: ['solvers'] },
            { class: 'coupled_system', parents: [] },
        ]);
        expect(isSubclassOf(duplicated, 'fsi_system', 'coupled_system')).toBe(true);
        expect(isSubclassOf(duplicated, 'fsi_system', 'solvers')).toBe(true);
    });

    it('terminates on parent cycles', () => {
        const cyclic = buildParentsIndex([
            { class: 'a', parents: ['b'] },
            { class: 'b', parents: ['a'] },
        ]);
        expect(isSubclassOf(cyclic, 'a', 'coupled_system')).toBe(false);
    });
});
