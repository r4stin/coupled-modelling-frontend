'use client';

import { Chip } from '@heroui/react';
import { FC } from 'react';

import PreviewLine from '@/components/PreviewLine/PreviewLine';
import { hasDistinctLabel, navLinkClass } from '@/lib/styles';
import { valueDisplayLabel } from '@/lib/valueDisplay';
import { InstancePropertyGroup } from '@/types/backend';

const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

/** Short display name of an XSD datatype IRI (`…XMLSchema#integer` → `integer`, slash-terminated IRIs included). */
const datatypeShortName = (datatype: string) => datatype.split(/[#/]/).pop() || datatype;

type Props = {
    value: InstancePropertyGroup['values'][number];
    /** Required for object values (they render as navigation links); literals never navigate. */
    onNavigate?: (id: string) => void;
};

/** One property value: a navigable link for object values, value + datatype/language badge for literals. */
const PropertyValue: FC<Props> = ({ value, onNavigate }) => {
    if (value.kind === 'object') {
        const link = (
            <button type="button" className={navLinkClass} title={`Navigate to ${value.id}`} onClick={() => onNavigate?.(value.id)}>
                {valueDisplayLabel(value)}
            </button>
        );
        // An unlabeled target is described by its class and a property preview
        // instead of its raw UUID id; the full id stays in the tooltip.
        if (hasDistinctLabel(value.label, value.id)) {
            return link;
        }
        return (
            <span className="min-w-0">
                {link}
                <PreviewLine preview={value.property_preview} truncated={value.preview_truncated} />
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5">
            {value.value === '' ? <span className="text-muted italic">(empty)</span> : <span className="break-all">{String(value.value)}</span>}
            {value.language ? (
                <Chip color="default" size="sm" variant="soft">
                    {value.language}
                </Chip>
            ) : (
                value.datatype !== XSD_STRING && (
                    <Chip color="default" size="sm" variant="soft">
                        {datatypeShortName(value.datatype)}
                    </Chip>
                )
            )}
        </span>
    );
};

export default PropertyValue;
