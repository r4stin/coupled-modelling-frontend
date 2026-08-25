'use client';

import { ListBox, Select } from '@heroui/react';
import { FC } from 'react';

export type SelectOption = { id: string; label: string };

type Props = {
    'aria-label'?: string;
    /** Id of a visible label element naming the select. */
    'aria-labelledby'?: string;
    options: SelectOption[];
    value: string;
    onChange: (id: string) => void;
    isDisabled?: boolean;
    fullWidth?: boolean;
    className?: string;
};

/** Single-choice dropdown over a fixed option list. */
const OptionSelect: FC<Props> = ({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    options,
    value,
    onChange,
    isDisabled,
    fullWidth,
    className,
}) => (
    <Select
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={className}
        fullWidth={fullWidth}
        isDisabled={isDisabled}
        value={value}
        onChange={(key) => key !== null && onChange(String(key))}
    >
        <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
            <ListBox>
                {options.map((option) => (
                    <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                        {option.label}
                    </ListBox.Item>
                ))}
            </ListBox>
        </Select.Popover>
    </Select>
);

export default OptionSelect;
