'use client';

import { memo } from 'react';

import { hasDistinctLabel, selectableRowClass } from '@/lib/styles';
import { ClassInstanceSummary } from '@/types/backend';

type Props = {
    instance: ClassInstanceSummary;
    isSelected: boolean;
    onSelect: (id: string) => void;
};

const InstanceListItem = ({ instance, isSelected, onSelect }: Props) => (
    <li>
        <button
            type="button"
            aria-current={isSelected || undefined}
            className={selectableRowClass(isSelected, 'w-full px-2 py-1.5 text-left')}
            onClick={() => onSelect(instance.id)}
        >
            <span className="text-sm">{instance.label}</span>
            {hasDistinctLabel(instance.label, instance.id) && <span className="ml-1 text-xs text-muted">({instance.id})</span>}
            {instance.property_preview.length > 0 && (
                <span className="mt-0.5 block truncate text-xs text-muted">
                    {instance.property_preview.map((preview, index) => (
                        <span key={`${preview.property}-${index}`}>
                            {index > 0 && ' · '}
                            <span className="font-medium">{preview.property}:</span> {String(preview.value)}
                        </span>
                    ))}
                    {instance.preview_truncated && <span className="italic"> · + more</span>}
                </span>
            )}
        </button>
    </li>
);

export default memo(InstanceListItem);
