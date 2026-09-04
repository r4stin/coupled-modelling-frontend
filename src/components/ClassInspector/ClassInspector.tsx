'use client';

import { Spinner } from '@heroui/react';
import { FC, ReactNode, useState } from 'react';
import useSWR from 'swr';

import { ClassNavLinkList } from '@/components/ClassInspector/ClassNavLink';
import RestrictionItem from '@/components/ClassInspector/RestrictionItem';
import ErrorAlert from '@/components/ErrorAlert/ErrorAlert';
import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { classMetadataUrl, getClassMetadata } from '@/services/backend/classes';
import { NamedReference, Restriction } from '@/types/backend';

// Related-class lists grow without bound (each Kratos import creates numbered
// classes), so long rows collapse behind a toggle — but only when it hides at
// least two entries; hiding a single one would cost a click without saving space.
const VISIBLE_REFS_LIMIT = 5;

const RelationshipRow: FC<{ label: string; refs: NamedReference[]; emptyText: string; onNavigate: (id: string) => void }> = ({
    label,
    refs,
    emptyText,
    onNavigate,
}) => {
    const [showAll, setShowAll] = useState(false);
    if (refs.length === 0) {
        return (
            <div>
                <span className="font-medium">{label}: </span>
                <span className="text-muted">{emptyText}</span>
            </div>
        );
    }
    const hiddenCount = refs.length > VISIBLE_REFS_LIMIT + 1 ? refs.length - VISIBLE_REFS_LIMIT : 0;
    return (
        <div>
            <span className="font-medium">{label}: </span>
            <ClassNavLinkList refs={hiddenCount > 0 && !showAll ? refs.slice(0, VISIBLE_REFS_LIMIT) : refs} separator=", " onNavigate={onNavigate} />
            {hiddenCount > 0 && (
                <>
                    {' · '}
                    <button type="button" className="text-muted hover:underline" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show less' : `+${hiddenCount} more`}
                    </button>
                </>
            )}
        </div>
    );
};

const restrictionKey = (restriction: Restriction) =>
    `${restriction.property.id}:${restriction.kind}:${restriction.target?.id ?? ''}:${restriction.cardinality ?? ''}`;

type Props = {
    /** Ontology class whose metadata is shown. */
    classId: string;
};

/** Class metadata card: descriptions, related classes, and asserted OWL restriction axioms. */
const ClassInspector = ({ classId }: Props) => {
    const { data, isLoading } = useSWR([classMetadataUrl, classId], () => getClassMetadata(classId));
    const { selectClass } = useExplorerSelection();

    let content: ReactNode;
    if (isLoading) {
        content = (
            <div className="flex items-center gap-2 text-muted" role="status" aria-label="Loading class details">
                <Spinner size="sm" /> Loading class details…
            </div>
        );
    } else if (!data) {
        // Non-fatal: the instance list below stays usable without the metadata card.
        content = (
            <ErrorAlert
                status="warning"
                role="status"
                title="Could not load the class details"
                description="Check the backend connection, then refresh."
            />
        );
    } else {
        content = (
            <>
                {data.descriptions.length > 0 ? (
                    data.descriptions.map((description, index) => <p key={index}>{description}</p>)
                ) : (
                    <p className="text-muted">No description available</p>
                )}
                {/* Keyed by class so any expanded row collapses again when navigating to another class. */}
                <div key={data.id} className="space-y-1">
                    <RelationshipRow label="Superclasses" refs={data.superclasses} emptyText="None (Root Class)" onNavigate={selectClass} />
                    <RelationshipRow label="Subclasses" refs={data.subclasses} emptyText="None (Leaf Class)" onNavigate={selectClass} />
                    <RelationshipRow label="Equivalent to" refs={data.equivalent_classes} emptyText="None" onNavigate={selectClass} />
                </div>
                <div>
                    <div className="font-medium">Asserted Restrictions:</div>
                    {data.restrictions.length > 0 ? (
                        <ul className="mt-1 list-inside list-disc space-y-0.5">
                            {data.restrictions.map((restriction) => (
                                <RestrictionItem key={restrictionKey(restriction)} restriction={restriction} onNavigate={selectClass} />
                            ))}
                        </ul>
                    ) : (
                        <span className="text-muted">No class restrictions asserted</span>
                    )}
                </div>
            </>
        );
    }

    return <div className="space-y-2 rounded-lg border border-border bg-background-secondary p-3 text-sm">{content}</div>;
};

export default ClassInspector;
