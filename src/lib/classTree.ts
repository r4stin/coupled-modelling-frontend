import { ClassHierarchyEntry } from '@/types/backend';

export type ClassTreeNode = {
    name: string;
    children: ClassTreeNode[];
};

const byName = (a: string, b: string) => a.localeCompare(b);

/**
 * Builds the class tree from the flat class/parents list returned by the backend.
 *
 * - Roots are classes with no parent inside the returned set.
 * - A class with several parents appears under each of them; the subtree object is
 *   shared, not rebuilt, so diamond-shaped hierarchies stay linear in size.
 * - Duplicate rows and self-parent edges are ignored.
 * - Classes locked inside a parent cycle are unreachable from any root; each cycle is
 *   surfaced at its alphabetically first member, with the cycling edge cut.
 */
export const buildClassTree = (entries: ClassHierarchyEntry[]): ClassTreeNode[] => {
    const known = new Set(entries.map((entry) => entry.class));
    const childrenOf = new Map<string, Set<string>>();
    const hasKnownParent = new Set<string>();
    for (const entry of entries) {
        for (const parent of entry.parents) {
            if (known.has(parent) && parent !== entry.class) {
                hasKnownParent.add(entry.class);
                const siblings = childrenOf.get(parent);
                if (siblings) {
                    siblings.add(entry.class);
                } else {
                    childrenOf.set(parent, new Set([entry.class]));
                }
            }
        }
    }

    const visited = new Set<string>();
    // Cache subtrees so a multi-parent class reuses one node object per subtree;
    // only subtrees built without cutting a cycle are safe to share.
    const cache = new Map<string, ClassTreeNode>();

    const buildNode = (name: string, path: Set<string>): ClassTreeNode => {
        visited.add(name);
        const cached = cache.get(name);
        if (cached) {
            return cached;
        }
        const childPath = new Set(path).add(name);
        const childNames = [...(childrenOf.get(name) ?? [])].toSorted(byName);
        const keptNames = childNames.filter((child) => !childPath.has(child));
        const node: ClassTreeNode = {
            name,
            children: keptNames.map((child) => buildNode(child, childPath)),
        };
        if (keptNames.length === childNames.length && node.children.every((child) => cache.has(child.name))) {
            cache.set(name, node);
        }
        return node;
    };

    const allClasses = [...known].toSorted(byName);
    const tree = allClasses.filter((name) => !hasKnownParent.has(name)).map((name) => buildNode(name, new Set<string>()));

    const isInCycle = (start: string): boolean => {
        const stack = [...(childrenOf.get(start) ?? [])];
        const seen = new Set<string>();
        while (stack.length > 0) {
            const current = stack.pop() as string;
            if (current === start) {
                return true;
            }
            if (!seen.has(current)) {
                seen.add(current);
                stack.push(...(childrenOf.get(current) ?? []));
            }
        }
        return false;
    };

    for (const name of allClasses) {
        if (!visited.has(name) && isInCycle(name)) {
            tree.push(buildNode(name, new Set<string>()));
        }
    }
    // Safety net so no class can ever be silently hidden.
    for (const name of allClasses) {
        if (!visited.has(name)) {
            tree.push(buildNode(name, new Set<string>()));
        }
    }

    return tree.toSorted((a, b) => byName(a.name, b.name));
};

/** Class → parents lookup for ancestry queries; parents of duplicate rows are merged. */
export const buildParentsIndex = (entries: ClassHierarchyEntry[]): Map<string, string[]> => {
    const parentsOf = new Map<string, string[]>();
    for (const entry of entries) {
        const parents = parentsOf.get(entry.class);
        if (parents) {
            parents.push(...entry.parents);
        } else {
            parentsOf.set(entry.class, [...entry.parents]);
        }
    }
    return parentsOf;
};

/** True when the class is the ancestor itself or reaches it through any parent chain (cycle-safe). */
export const isSubclassOf = (parentsOf: Map<string, string[]>, className: string, ancestor: string): boolean => {
    const visited = new Set<string>();
    const queue = [className];
    for (const current of queue) {
        if (current === ancestor) {
            return true;
        }
        if (!visited.has(current)) {
            visited.add(current);
            queue.push(...(parentsOf.get(current) ?? []));
        }
    }
    return false;
};

/** Every path (root → … → occurrence) at which the given class appears in the tree. */
/**
 * Row-key encoding for tree occurrences: the '/'-joined trail of class names
 * from a root ('a/shared'), unique per occurrence of a multi-parent class.
 * '/' is a safe delimiter: backend local names are validated to alphanumerics
 * plus '_', '-' and '.' (never '/').
 */
export const childPath = (parentPath: string, name: string): string => (parentPath ? `${parentPath}/${name}` : name);

export const pathKey = (trail: string[]): string => trail.join('/');

export const classOfPath = (path: string): string => path.split('/').at(-1) ?? path;

/** Every path prefix leading to one of the given occurrences, each occurrence itself included. */
export const revealedPrefixes = (occurrences: string[][]): Set<string> => {
    const keys = new Set<string>();
    for (const trail of occurrences) {
        let prefix = '';
        for (const name of trail) {
            prefix = childPath(prefix, name);
            keys.add(prefix);
        }
    }
    return keys;
};

export const findPathsToClass = (tree: ClassTreeNode[], name: string): string[][] => {
    const paths: string[][] = [];
    const walk = (node: ClassTreeNode, trail: string[]) => {
        const current = [...trail, node.name];
        if (node.name === name) {
            paths.push(current);
        }
        for (const child of node.children) {
            walk(child, current);
        }
    };
    for (const root of tree) {
        walk(root, []);
    }
    return paths;
};
