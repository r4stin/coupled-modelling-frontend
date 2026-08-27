'use client';

import { memo } from 'react';

import PreviewLine from '@/components/PreviewLine/PreviewLine';
import { hasDistinctLabel, selectableRowClass } from '@/lib/styles';
import { instanceDisplayName } from '@/lib/valueDisplay';
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
            <span className="text-sm">{instanceDisplayName(instance)}</span>
            {hasDistinctLabel(instance.label, instance.id) && <span className="ml-1 text-xs text-muted">({instance.id})</span>}
            <PreviewLine className="mt-0.5" preview={instance.property_preview} truncated={instance.preview_truncated} />
        </button>
    </li>
);

export default memo(InstanceListItem);
