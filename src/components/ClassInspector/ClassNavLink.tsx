'use client';

import { linkVariants } from '@heroui/react';
import { FC, Fragment } from 'react';

import { NamedReference } from '@/types/backend';

const linkClass = linkVariants().base();

/** Clickable class reference; navigation is injected so links stay purely presentational. */
export const ClassNavLink: FC<{ target: NamedReference; onNavigate: (id: string) => void }> = ({ target, onNavigate }) => (
    <button type="button" className={linkClass} onClick={() => onNavigate(target.id)}>
        {target.label}
    </button>
);

/** Class references joined by a separator (e.g. `a, b` for related classes, `a & b` for intersections). */
export const ClassNavLinkList: FC<{ refs: NamedReference[]; separator: string; onNavigate: (id: string) => void }> = ({
    refs,
    separator,
    onNavigate,
}) => (
    <>
        {refs.map((ref, index) => (
            <Fragment key={`${ref.id}-${index}`}>
                {index > 0 && separator}
                <ClassNavLink target={ref} onNavigate={onNavigate} />
            </Fragment>
        ))}
    </>
);
