import { hasDistinctLabel } from '@/lib/styles';
import { InstancePropertyGroup } from '@/types/backend';

const truncate = (text: string, max = 40) => (text.length > max ? `${text.slice(0, max - 3)}…` : text);

/**
 * Display label for a property value, shared by the rendered list, delete buttons,
 * confirmation dialogs, and toasts so all surfaces describe the same value identically.
 */
export const valueDisplayLabel = (value: InstancePropertyGroup['values'][number]): string => {
    if (value.kind === 'object') {
        return truncate(hasDistinctLabel(value.label, value.id) ? `${value.label} (${value.id})` : value.id);
    }
    return value.value === '' ? '(empty)' : truncate(String(value.value));
};
