'use client';

import { Button, Modal } from '@heroui/react';
import { FC, ReactNode } from 'react';

type Props = {
    isOpen: boolean;
    title: string;
    submitLabel: string;
    /** Label shown on the submit button while the action runs. */
    pendingLabel: string;
    isPending: boolean;
    onSubmit: () => void;
    onClose: () => void;
    /** Form fields. */
    children: ReactNode;
};

/** Modal dialog with form fields, submit-on-Enter, and Cancel/submit actions. */
const FormDialog: FC<Props> = ({ isOpen, title, submitLabel, pendingLabel, isPending, onSubmit, onClose, children }) => {
    return (
        <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
            <Modal.Container>
                <Modal.Dialog>
                    <Modal.Header>
                        <Modal.Heading>{title}</Modal.Heading>
                    </Modal.Header>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSubmit();
                        }}
                    >
                        <Modal.Body className="space-y-4">{children}</Modal.Body>
                        <Modal.Footer>
                            <Button variant="ghost" isDisabled={isPending} onPress={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" isDisabled={isPending}>
                                {isPending ? pendingLabel : submitLabel}
                            </Button>
                        </Modal.Footer>
                    </form>
                </Modal.Dialog>
            </Modal.Container>
        </Modal.Backdrop>
    );
};

export default FormDialog;
