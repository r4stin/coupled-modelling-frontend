'use client';

import { FC } from 'react';

import { ClassNavLink, ClassNavLinkList } from '@/components/ClassInspector/ClassNavLink';
import { restrictionKindLabel } from '@/lib/restrictions';
import { Restriction } from '@/types/backend';

/**
 * Whether the restriction target is a class the explorer can navigate to. The backend
 * defaults `target_kind` to "class" when omitted, so an absent kind stays navigable;
 * `has_value` targets are individuals or literals, never classes, so they never link.
 */
const isNavigableTarget = (restriction: Restriction) =>
    restriction.kind !== 'has_value' && (restriction.target_kind === 'class' || restriction.target_kind === undefined);

/** One asserted OWL restriction, e.g. `has_data some data_1` or `has_io_settings exactly 1 io_settings_1`. */
const RestrictionItem: FC<{ restriction: Restriction; onNavigate: (id: string) => void }> = ({ restriction, onNavigate }) => {
    const { target, target_kind: targetKind } = restriction;
    return (
        <li className="text-sm">
            <span className="font-medium">{restriction.property.label}</span>{' '}
            <span className="text-muted italic">{restrictionKindLabel(restriction.kind)}</span>
            {restriction.cardinality !== undefined && <> {restriction.cardinality}</>}
            {target && (
                <>
                    {' '}
                    {isNavigableTarget(restriction) ? (
                        <ClassNavLink target={target} onNavigate={onNavigate} />
                    ) : targetKind === 'intersection' && target.members?.length ? (
                        <ClassNavLinkList refs={target.members} separator=" & " onNavigate={onNavigate} />
                    ) : (
                        <span className="text-muted">{target.label}</span>
                    )}
                </>
            )}
        </li>
    );
};

export default RestrictionItem;
