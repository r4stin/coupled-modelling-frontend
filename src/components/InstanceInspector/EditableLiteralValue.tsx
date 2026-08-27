'use client';

import { Button, Input, toast } from '@heroui/react';
import { FC, KeyboardEvent, useState } from 'react';

import OptionSelect from '@/components/FormDialog/OptionSelect';
import Icon from '@/components/Icons/Icon';
import PropertyValue from '@/components/InstanceInspector/PropertyValue';
import { getApiErrorMessage } from '@/lib/apiError';
import { toDeleteTarget } from '@/lib/deleteTargets';
import { BOOLEAN_OPTIONS, parseLiteralInput, XSD_BOOLEAN } from '@/lib/literalParsing';
import { valueDisplayLabel } from '@/lib/valueDisplay';
import { replaceValue } from '@/services/backend/instances';
import { LiteralPropertyValue } from '@/types/backend';

type Props = {
    instanceId: string;
    property: string;
    value: LiteralPropertyValue;
    /** Called after the new value is written; awaited so the editor closes only once the panes show fresh data. */
    onSaved: () => Promise<unknown> | void;
    /** Lets the owning row hide its other per-value actions while the editor is open. */
    onEditingChange?: (editing: boolean) => void;
};

/** A literal property value that turns into an inline editor on double-click or Enter. */
const EditableLiteralValue: FC<Props> = ({ instanceId, property, value, onSaved, onEditingChange }) => {
    const [draft, setDraft] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const save = async () => {
        if (draft === null) {
            return;
        }
        const parsed = parseLiteralInput(draft, value.datatype);
        if (!parsed.ok) {
            toast.warning(parsed.message);
            return;
        }
        setIsSaving(true);
        try {
            // One atomic backend operation: the old term is matched exactly (language tag
            // included) and the new term keeps the original datatype and language.
            await replaceValue(instanceId, property, toDeleteTarget(value), {
                kind: 'literal',
                value: parsed.value,
                datatype: value.datatype,
                ...(value.language ? { language: value.language } : {}),
            });
            toast.success(`Updated ${property}`);
            await onSaved();
            stopEditing();
        } catch (editError) {
            toast.danger(await getApiErrorMessage(editError, 'Edit failed'));
        } finally {
            setIsSaving(false);
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            save();
        } else if (event.key === 'Escape') {
            stopEditing();
        }
    };

    const startEditing = () => {
        // Booleans seed the select's option ids, so normalise the spelling.
        setDraft(value.datatype === XSD_BOOLEAN ? String(value.value).toLowerCase() : String(value.value));
        onEditingChange?.(true);
    };

    const stopEditing = () => {
        setDraft(null);
        onEditingChange?.(false);
    };

    if (draft === null) {
        return (
            <span
                role="button"
                tabIndex={0}
                aria-label={`Edit ${property} value ${valueDisplayLabel(value)}`}
                title="Double-click to edit"
                className="-mx-1 min-w-0 flex-1 cursor-text rounded px-1 py-0.5 hover:bg-default-soft focus-visible:outline focus-visible:outline-focus"
                onDoubleClick={startEditing}
                onKeyDown={(event) => event.key === 'Enter' && startEditing()}
            >
                <PropertyValue value={value} />
            </span>
        );
    }

    const editLabel = `Edit ${property} value ${valueDisplayLabel(value)}`;

    return (
        // Escape on the span keeps cancel reachable from the boolean select too.
        <span className="flex min-w-0 flex-1 items-center gap-1.5" onKeyDown={(event) => event.key === 'Escape' && stopEditing()}>
            {value.datatype === XSD_BOOLEAN ? (
                // Booleans are edited with a constrained choice: free text would
                // have to be coerced or rejected, a select cannot be mistyped.
                <OptionSelect
                    aria-label={editLabel}
                    autoFocus
                    className="min-w-0 flex-1"
                    options={BOOLEAN_OPTIONS}
                    value={draft}
                    onChange={setDraft}
                    isDisabled={isSaving}
                />
            ) : (
                <Input
                    aria-label={editLabel}
                    autoFocus
                    className="h-7 min-w-0 flex-1 text-sm"
                    value={draft}
                    disabled={isSaving}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={onKeyDown}
                />
            )}
            <Button size="sm" variant="primary" isDisabled={isSaving} onPress={save}>
                {isSaving ? '…' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" isIconOnly isDisabled={isSaving} aria-label="Cancel editing" onPress={stopEditing}>
                <Icon>
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </Icon>
            </Button>
        </span>
    );
};

export default EditableLiteralValue;
