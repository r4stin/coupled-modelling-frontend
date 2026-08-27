import { cn } from '@heroui/react';
import { FC } from 'react';

import { PreviewItem } from '@/types/backend';

type Props = {
    preview: PreviewItem[];
    truncated: boolean;
    className?: string;
};

/** One-line property preview ("prop: value · prop: value · + more"), shared by list rows and inspector links. */
const PreviewLine: FC<Props> = ({ preview, truncated, className }) => {
    if (preview.length === 0) {
        return null;
    }
    return (
        <span className={cn('block truncate text-xs text-muted', className)}>
            {preview.map((item, index) => (
                <span key={index}>
                    {index > 0 && ' · '}
                    <span className="font-medium">{item.property}:</span> {String(item.value)}
                </span>
            ))}
            {truncated && <span className="italic"> · + more</span>}
        </span>
    );
};

export default PreviewLine;
