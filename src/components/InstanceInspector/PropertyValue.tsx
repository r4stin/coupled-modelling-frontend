'use client';

import { Chip } from '@heroui/react';
import { FC } from 'react';

import { navLinkClass } from '@/lib/styles';
import { valueDisplayLabel } from '@/lib/valueDisplay';
import { InstancePropertyGroup } from '@/types/backend';

const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

/** Short display name of an XSD datatype IRI (`…XMLSchema#integer` → `integer`, slash-terminated IRIs included). */
const datatypeShortName = (datatype: string) => datatype.split(/[#/]/).pop() || datatype;

type Props = {
    value: InstancePropertyGroup['values'][number];
    onNavigate: (id: string) => void;
};

/** One property value: a navigable link for object values, value + datatype/language badge for literals. */
const PropertyValue: FC<Props> = ({ value, onNavigate }) => {
    if (value.kind === 'object') {
        return (
            <button type="button" className={navLinkClass} title={`Navigate to ${value.id}`} onClick={() => onNavigate(value.id)}>
                {valueDisplayLabel(value)}
            </button>
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
