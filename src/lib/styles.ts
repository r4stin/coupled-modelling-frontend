import { cn } from '@heroui/react';

/** Selection highlight shared by every selectable row in the explorer panes. */
export const selectableRowClass = (isSelected: boolean, ...extra: (string | false | undefined)[]) =>
    cn('rounded-md', isSelected ? 'bg-accent-soft text-accent-soft-foreground' : 'hover:bg-default-soft', ...extra);
