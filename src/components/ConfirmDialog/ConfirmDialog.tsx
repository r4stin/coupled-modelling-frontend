'use client';

import { AlertDialog, Button } from '@heroui/react';
import { FC, useState } from 'react';

type Props = {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    /** Label shown on the confirm button while the action runs. */
    pendingLabel?: string;
    isPending: boolean;
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
    onConfirm,
    onCancel,
}) => {
    // Retain the last shown content so the close animation doesn't flash empty text
    // when the caller clears its pending state on success (render-phase adjustment).
    const [content, setContent] = useState({ title, message });
    if (isOpen && (content.title !== title || content.message !== message)) {
        setContent({ title, message });
    }

    return (
        <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && !isPending && onCancel()}>
            <AlertDialog.Container>
                <AlertDialog.Dialog>
                    <AlertDialog.Header>
                        <AlertDialog.Icon status="danger" />
                        <AlertDialog.Heading>{content.title}</AlertDialog.Heading>
                    </AlertDialog.Header>
                    <AlertDialog.Body>{content.message}</AlertDialog.Body>
                    <AlertDialog.Footer>
                        <Button variant="ghost" isDisabled={isPending} onPress={onCancel}>
                            Cancel
                        </Button>
                        <Button variant="danger" isDisabled={isPending} onPress={onConfirm}>
                            {isPending ? pendingLabel : confirmLabel}
                        </Button>
                    </AlertDialog.Footer>
                </AlertDialog.Dialog>
            </AlertDialog.Container>
        </AlertDialog.Backdrop>
    );
};

export default ConfirmDialog;
