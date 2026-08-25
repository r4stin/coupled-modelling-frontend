'use client';

import { Button, toast } from '@heroui/react';
import { FC, useState } from 'react';

import FormDialog from '@/components/FormDialog/FormDialog';
import LabelledInput from '@/components/FormDialog/LabelledInput';
import { useExplorerRefresh } from '@/lib/useExplorerRefresh';
import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { useLabelledCreate } from '@/lib/useLabelledCreate';
import { createClassInstance } from '@/services/backend/classes';

type Props = {
    /** Class the new instance is created in. */
    classId: string;
};

/** Pane-header action that creates a standalone labelled instance of the selected class and selects it. */
const CreateClassInstance: FC<Props> = ({ classId }) => {
    const { refreshClassInstances } = useExplorerRefresh();
    const { selectInstance } = useExplorerSelection();
    const [isOpen, setIsOpen] = useState(false);
    const { label, setLabel, isCreating, submit, close } = useLabelledCreate({
        emptyMessage: 'Please enter a label for the new instance',
        create: async (trimmed) => {
            const newId = await createClassInstance(classId, trimmed);
            toast.success('Instance created');
            // Select right away; the list refresh runs in the background so a
            // transient refresh failure cannot masquerade as a failed creation.
            selectInstance(newId);
            refreshClassInstances([classId]).catch(() => undefined);
        },
        onClose: () => setIsOpen(false),
    });

    return (
        <>
            <Button size="sm" variant="primary" onPress={() => setIsOpen(true)}>
                Add instance
            </Button>
            <FormDialog
                isOpen={isOpen}
                title={`New ${classId} instance`}
                submitLabel="Create"
                pendingLabel="Creating…"
                isPending={isCreating}
                onSubmit={submit}
                onClose={close}
            >
                <LabelledInput
                    id="create-instance-label-input"
                    label="Instance label"
                    placeholder="e.g. Airfoil fluid solver"
                    value={label}
                    disabled={isCreating}
                    onChange={(event) => setLabel(event.target.value)}
                />
            </FormDialog>
        </>
    );
};

export default CreateClassInstance;
