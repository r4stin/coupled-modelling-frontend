'use client';

import { AlertDialog, Button } from '@heroui/react';
import { FC, useId, useState } from 'react';

type Props = {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    /** Label shown on the confirm button while the action runs. */
    pendingLabel?: string;
    isPending: boolean;
    /** Blocks confirming while the message is not final yet (e.g. a consequence preview is loading). */
    isConfirmDisabled?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

/** Confirmation dialog for destructive explorer actions. */
const ConfirmDialog: FC<Props> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Delete',
    pendingLabel = 'Deleting…',
    isPending,
    isConfirmDisabled = false,
    onConfirm,
    onCancel,
}) => {
    // Retains the last content through the close animation and freezes it while the action runs (render-phase adjustment).
    const [content, setContent] = useState({ title, message });
    if (isOpen && !isPending && (content.title !== title || content.message !== message)) {
        setContent({ title, message });
    }
    const messageId = useId();

    return (
        <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && !isPending && onCancel()}>
            <AlertDialog.Container>
                <AlertDialog.Dialog aria-describedby={messageId}>
                    <AlertDialog.Header>
                        <AlertDialog.Icon status="danger" />
                        <AlertDialog.Heading>{content.title}</AlertDialog.Heading>
                    </AlertDialog.Header>
                    <AlertDialog.Body>
                        {/* Live region: the message can change while the dialog is open (a loaded preview). */}
                        <span id={messageId} aria-live="polite">
                            {content.message}
                        </span>
                    </AlertDialog.Body>
                    <AlertDialog.Footer>
                        <Button variant="ghost" isDisabled={isPending} onPress={onCancel}>
                            Cancel
                        </Button>
                        <Button variant="danger" isDisabled={isPending || isConfirmDisabled} onPress={onConfirm}>
                            {isPending ? pendingLabel : confirmLabel}
                        </Button>
                    </AlertDialog.Footer>
                </AlertDialog.Dialog>
            </AlertDialog.Container>
        </AlertDialog.Backdrop>
    );
};

export default ConfirmDialog;
