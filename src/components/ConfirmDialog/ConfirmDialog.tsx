'use client';

import { AlertDialog, Button } from '@heroui/react';
import { FC, useId, useState } from 'react';

type Props = {
    isOpen: boolean;
    title: string;
    message: string;
    /** Consequences of confirming, one line each; rendered below the message. */
    consequences?: string[];
    confirmLabel?: string;
    /** Label shown on the confirm button while the action runs. */
    pendingLabel?: string;
    isPending: boolean;
    /** Blocks confirming while the message is not final yet (e.g. a consequence preview is loading). */
    isConfirmDisabled?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

const sameLines = (a: string[], b: string[]) => a.length === b.length && a.every((line, index) => line === b[index]);

/** Confirmation dialog for destructive explorer actions. */
const ConfirmDialog: FC<Props> = ({
    isOpen,
    title,
    message,
    consequences = [],
    confirmLabel = 'Delete',
    pendingLabel = 'Deleting…',
    isPending,
    isConfirmDisabled = false,
    onConfirm,
    onCancel,
}) => {
    // Retains the last content through the close animation and freezes it while the action runs (render-phase adjustment).
    const [content, setContent] = useState({ title, message, consequences });
    if (isOpen && !isPending && (content.title !== title || content.message !== message || !sameLines(content.consequences, consequences))) {
        setContent({ title, message, consequences });
    }
    const descriptionId = useId();

    return (
        <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && !isPending && onCancel()}>
            <AlertDialog.Container>
                <AlertDialog.Dialog aria-describedby={descriptionId}>
                    <AlertDialog.Header>
                        <AlertDialog.Icon status="danger" />
                        <AlertDialog.Heading>{content.title}</AlertDialog.Heading>
                    </AlertDialog.Header>
                    <AlertDialog.Body>
                        {/* Live region: the question and its consequences change while the dialog is open (a loaded preview). */}
                        <div id={descriptionId} aria-live="polite" aria-atomic="true">
                            <p>{content.message}</p>
                            {content.consequences.length > 0 && (
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    {content.consequences.map((line, index) => (
                                        <li key={index}>{line}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
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
