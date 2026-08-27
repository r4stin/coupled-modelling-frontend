import { hasDistinctLabel } from '@/lib/styles';
import { InstancePropertyGroup } from '@/types/backend';

const truncate = (text: string, max = 40) => (text.length > max ? `${text.slice(0, max - 3)}…` : text);

const UUID_INSTANCE_ID = /^instance_[0-9a-f]{8}-/;

/**
 * Compact display form of a UUID instance id (`instance_733f1d…`); the full id
 * stays in tooltips. Human-chosen ids are kept whole — their tails are often
 * the only distinguishing part.
 */
export const shortInstanceId = (id: string) => (UUID_INSTANCE_ID.test(id) ? truncate(id, 18) : id);

/**
 * Display name for an instance, shared by list rows, inspector headings, and
 * object links: the label when one exists, otherwise its class and short id.
 */
export const instanceDisplayName = (instance: { id: string; label: string; types?: string[] }): string =>
    hasDistinctLabel(instance.label, instance.id) ? instance.label : `${instance.types?.[0] ?? 'instance'} · ${shortInstanceId(instance.id)}`;

/**
 * Display label for a property value, shared by the rendered list, delete buttons,
 * confirmation dialogs, and toasts so all surfaces describe the same value identically.
 */
export const valueDisplayLabel = (value: InstancePropertyGroup['values'][number]): string => {
    if (value.kind === 'object') {
        return hasDistinctLabel(value.label, value.id) ? truncate(`${value.label} (${value.id})`) : instanceDisplayName(value);
    }
    return value.value === '' ? '(empty)' : truncate(String(value.value));
};
