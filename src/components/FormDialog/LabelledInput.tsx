'use client';

import { Input, Label } from '@heroui/react';
import { ComponentProps, FC } from 'react';

type Props = {
    id: string;
    label: string;
} & Omit<ComponentProps<typeof Input>, 'id'>;

/** A visible label tied to a text input, for form dialogs. */
const LabelledInput: FC<Props> = ({ id, label, ...inputProps }) => (
    <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} {...inputProps} />
    </div>
);

export default LabelledInput;
