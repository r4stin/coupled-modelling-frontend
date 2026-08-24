'use client';

import { Alert, Spinner } from '@heroui/react';
import { FC, ReactNode } from 'react';
import useSWR from 'swr';

import { ClassNavLinkList } from '@/components/ClassInspector/ClassNavLink';
import RestrictionItem from '@/components/ClassInspector/RestrictionItem';
import { useExplorerSelection } from '@/lib/useExplorerSelection';
import { classMetadataUrl, getClassMetadata } from '@/services/backend/classes';
import { NamedReference, Restriction } from '@/types/backend';

const RelationshipRow: FC<{ label: string; refs: NamedReference[]; emptyText: string; onNavigate: (id: string) => void }> = ({
    label,
    refs,
    emptyText,
    onNavigate,
}) => (
    <div>
        <span className="font-medium">{label}: </span>
        {refs.length > 0 ? <ClassNavLinkList refs={refs} separator=", " onNavigate={onNavigate} /> : <span className="text-muted">{emptyText}</span>}
    </div>
);

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
            <Alert status="warning">
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Title>Could not load the class details</Alert.Title>
                    <Alert.Description>Check the backend connection, then refresh.</Alert.Description>
                </Alert.Content>
            </Alert>
        );
    } else {
        content = (
            <>
                {data.descriptions.length > 0 ? (
                    data.descriptions.map((description, index) => <p key={index}>{description}</p>)
                ) : (
                    <p className="text-muted">No description available</p>
                )}
                <div className="space-y-1">
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
