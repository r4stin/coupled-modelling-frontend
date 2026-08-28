import { cn, linkVariants } from '@heroui/react';

/** Selection highlight and keyboard-focus treatment shared by every selectable row in the explorer panes. */
export const selectableRowClass = (isSelected: boolean, ...extra: (string | false | undefined)[]): string =>
    cn(
        'rounded-md focus-visible:outline focus-visible:outline-focus',
        isSelected ? 'bg-accent-soft text-accent-soft-foreground' : 'hover:bg-default-soft',
        ...extra,
    ) ?? '';

/** Styling shared by every navigation link rendered as a button (class refs, object property values). */
export const navLinkClass = linkVariants().base();

/** Display rule shared by list items and property values: show the raw id only when a distinct label exists. */
export const hasDistinctLabel = (label: string, id: string) => label !== id;
