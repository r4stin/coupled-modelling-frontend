'use client';

import { Label, toast } from '@heroui/react';
import { FC, useState } from 'react';

import FormDialog from '@/components/FormDialog/FormDialog';
import LabelledInput from '@/components/FormDialog/LabelledInput';
import OptionSelect from '@/components/FormDialog/OptionSelect';
import { CHILD_PROPERTY_OPTIONS } from '@/constants/properties';
import { useLabelledCreate } from '@/lib/useLabelledCreate';
import { createInstance } from '@/services/backend/instances';

type Props = {
    isOpen: boolean;
    /** Instance the new child is linked to. */
    parentId: string;
    /** Called with the created child's class; awaited before the dialog closes. */
    onCreated: (childClass: string) => Promise<unknown> | void;
    onClose: () => void;
};

/** Creates a new labelled instance linked to the parent via the chosen object property. */
const AddChildDialog: FC<Props> = ({ isOpen, parentId, onCreated, onClose }) => {
    const [property, setProperty] = useState(CHILD_PROPERTY_OPTIONS[0].id);
    const { label, setLabel, isCreating, submit, close } = useLabelledCreate({
        emptyMessage: 'Please enter a label for the child instance',
        create: async (trimmed) => {
            await createInstance(property, parentId, { label: trimmed });
            toast.success('Linked child instance created');
            await onCreated(property);
        },
        onClose,
        onReset: () => setProperty(CHILD_PROPERTY_OPTIONS[0].id),
    });

    return (
        <FormDialog
            isOpen={isOpen}
            title="Add linked child instance"
            submitLabel="Add child"
            pendingLabel="Adding…"
            isPending={isCreating}
            onSubmit={submit}
            onClose={close}
        >
            <div className="space-y-1">
                <Label id="add-child-property-label">Property (and target class)</Label>
                <OptionSelect
                    aria-labelledby="add-child-property-label"
                    options={CHILD_PROPERTY_OPTIONS}
                    value={property}
                    onChange={setProperty}
                    isDisabled={isCreating}
                />
            </div>
            <LabelledInput
                id="add-child-label-input"
                label="New instance label"
                placeholder="e.g. MyConvergenceAccel"
                value={label}
                disabled={isCreating}
                onChange={(event) => setLabel(event.target.value)}
            />
        </FormDialog>
    );
};

export default AddChildDialog;
