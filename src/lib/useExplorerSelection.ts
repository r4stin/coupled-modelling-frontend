'use client';

import { useQueryState } from 'nuqs';

/**
 * Single owner of the explorer's `?class=` and `?instance=` URL parameters and of
 * their invariant: the selected instance belongs to the selected class, so choosing
 * a different class clears the instance selection. Every surface that changes the
 * selection must go through this hook rather than reading the params directly.
 *
 * User-initiated selections push history entries so the browser's Back/Forward
 * buttons walk the in-app navigation trail instead of leaving the explorer.
 */
export const useExplorerSelection = () => {
    const [selectedClass, setSelectedClass] = useQueryState('class', { history: 'push' });
    const [selectedInstance, setSelectedInstance] = useQueryState('instance', { history: 'push' });

    const selectClass = (name: string) => {
        if (name !== selectedClass) {
            setSelectedClass(name);
            setSelectedInstance(null);
        }
    };

    // Same-value guard, like selectClass: nuqs pushes even for an identical URL, so
    // re-clicking the selected row would otherwise stack dead history entries.
    const selectInstance = (id: string | null) => {
        if (id !== selectedInstance) {
            setSelectedInstance(id);
        }
    };

    /**
     * Clears the selection after the inspected instance was removed from the
     * knowledge base. Replaces instead of pushing so the deleted instance's URL
     * is not preserved as the immediate Back target.
     */
    const clearRemovedInstance = () => setSelectedInstance(null, { history: 'replace' });

    /**
     * Re-establishes the invariant from the instance side: when the inspected instance
     * does not belong to the selected class (inspector link navigation), re-target the
     * class to the instance's first type, keeping the instance selected.
     */
    const alignClassWithInstanceTypes = (types: string[]) => {
        if (types.length > 0 && (!selectedClass || !types.includes(selectedClass))) {
            // Replace, never push: this corrects the history entry the user's own
            // navigation just created. Pushing would let Back land on the intermediate
            // "old class + new instance" URL, where this correction fires again and
            // pushes forward — trapping the Back button in a loop.
            setSelectedClass(types[0], { history: 'replace' });
        }
    };

    return { selectedClass, selectClass, selectedInstance, selectInstance, alignClassWithInstanceTypes, clearRemovedInstance };
};
