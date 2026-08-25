'use client';

import { Input, Label } from '@heroui/react';
import { ComponentProps, FC } from 'react';

type Props = {
    id: string;
    label: string;
} & Omit<ComponentProps<typeof Input>, 'id'>;

/** A visible label above a full-width text input, for form dialogs. */
const LabelledInput: FC<Props> = ({ id, label, ...inputProps }) => (
    <div className="space-y-1.5">
        <Label className="block" htmlFor={id}>
            {label}
        </Label>
        <Input fullWidth id={id} {...inputProps} />
    </div>
);

export default LabelledInput;
