'use client';

import { toast } from '@heroui/react';
import { useState } from 'react';

import { getApiErrorMessage } from '@/lib/apiError';

type Options = {
    /** Warning shown when submitting with an empty label. */
    emptyMessage: string;
    /** Performs the creation (service call, success toast, refresh); runs inside the pending/error handling. */
    create: (label: string) => Promise<unknown>;
    /** Called when the dialog should close (the draft is discarded first). */
    onClose: () => void;
    /** Extra per-dialog state reset when the dialog closes. */
    onReset?: () => void;
};

/**
 * Shared lifecycle of the label-based creation dialogs: draft label state,
 * trim + empty-label warning, pending flag, error toast, and close-discards-draft.
 */
export const useLabelledCreate = ({ emptyMessage, create, onClose, onReset }: Options) => {
    const [label, setLabel] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const close = () => {
        setLabel('');
        onReset?.();
        onClose();
    };

    const submit = async () => {
        const trimmed = label.trim();
        if (trimmed === '') {
            toast.warning(emptyMessage);
            return;
        }
        setIsCreating(true);
        try {
            await create(trimmed);
            close();
        } catch (createError) {
            toast.danger(await getApiErrorMessage(createError, 'Creation failed'));
        } finally {
            setIsCreating(false);
        }
    };

    return { label, setLabel, isCreating, submit, close };
};
