'use client';

import { useQueryState } from 'nuqs';

/**
 * Single owner of the explorer's `?class=` and `?instance=` URL parameters and of
 * their invariant: the selected instance belongs to the selected class, so choosing
 * a different class clears the instance selection. Every surface that changes the
 * selection must go through this hook rather than reading the params directly.
 */
export const useExplorerSelection = () => {
    const [selectedClass, setSelectedClass] = useQueryState('class');
    const [selectedInstance, setSelectedInstance] = useQueryState('instance');

    const selectClass = (name: string) => {
        if (name !== selectedClass) {
            setSelectedClass(name);
            setSelectedInstance(null);
        }
    };

    return { selectedClass, selectClass, selectedInstance, selectInstance: setSelectedInstance };
};
