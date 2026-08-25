'use client';

import { Button, Input, toast } from '@heroui/react';
import { FC, useState } from 'react';

import OptionSelect from '@/components/FormDialog/OptionSelect';
import { VALUE_PROPERTY_OPTIONS, VALUE_TYPE_OPTIONS } from '@/constants/properties';
import { getApiErrorMessage } from '@/lib/apiError';
import { parseTypedValueInput, ValueTypeId } from '@/lib/literalParsing';
import { addValues } from '@/services/backend/instances';

type Props = {
    instanceId: string;
    /** Called with the added property's name; awaited so the form clears only once the panes show fresh data. */
    onAdded: (property: string) => Promise<unknown> | void;
};

/** Appends a property value to the inspected instance: property + input interpretation + value. */
const AddValueForm: FC<Props> = ({ instanceId, onAdded }) => {
    const [property, setProperty] = useState(VALUE_PROPERTY_OPTIONS[0].id);
    const [valueType, setValueType] = useState<ValueTypeId>('string');
    const [raw, setRaw] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const add = async () => {
        if (isAdding) {
            return;
        }
        const parsed = parseTypedValueInput(raw, valueType);
        if (!parsed.ok) {
            toast.warning(parsed.message);
            return;
        }
        setIsAdding(true);
        try {
            await addValues(instanceId, { [property]: parsed.value });
            toast.success(`Added ${property} value`);
            await onAdded(property);
            setRaw('');
        } catch (addError) {
            toast.danger(await getApiErrorMessage(addError, 'Add value failed'));
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <form
            aria-label="Add property value"
            className="flex flex-wrap items-center gap-1.5"
            onSubmit={(event) => {
                event.preventDefault();
                add();
            }}
        >
            <OptionSelect
                aria-label="Property to add"
                className="w-44"
                options={VALUE_PROPERTY_OPTIONS}
                value={property}
                onChange={setProperty}
                isDisabled={isAdding}
            />
            <OptionSelect
                aria-label="Value type"
                className="w-28"
                options={VALUE_TYPE_OPTIONS}
                value={valueType}
                onChange={(id) => setValueType(id as ValueTypeId)}
                isDisabled={isAdding}
            />
            {/* Stays enabled during the request so keyboard focus survives repeated adds. */}
            <Input
                aria-label="New value"
                placeholder="Enter value or instance ID…"
                className="min-w-32 flex-1"
                value={raw}
                onChange={(event) => setRaw(event.target.value)}
            />
            <Button type="submit" size="sm" variant="primary" isDisabled={isAdding}>
                {isAdding ? 'Adding…' : 'Add'}
            </Button>
        </form>
    );
};

export default AddValueForm;
