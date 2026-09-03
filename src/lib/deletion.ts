import { InstanceDeletionPreview } from '@/types/backend';

export const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** Fills in fields an older backend build may omit, so a version mismatch degrades to a plain confirmation instead of a crash. */
export const normalizeDeletionPreview = (instance: string, raw: Partial<InstanceDeletionPreview> | null | undefined): InstanceDeletionPreview => ({
    instance: raw?.instance ?? instance,
    deleted: raw?.deleted ?? [instance],
    kept: raw?.kept ?? [],
    unlinked_from: raw?.unlinked_from ?? [],
});

/** Instances removed besides the requested one. */
export const containedCount = ({ instance, deleted }: Pick<InstanceDeletionPreview, 'instance' | 'deleted'>) =>
    deleted.filter((id) => id !== instance).length;

export type DeletionPreviewState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; preview: InstanceDeletionPreview };

/** Confirmation text for an instance deletion; the cascade scope is spelled out once the preview is known. */
export const deletionMessage = (instanceDisplay: string, state: DeletionPreviewState) => {
    if (state.status === 'loading') {
        return `Checking what deleting instance ${instanceDisplay} would remove…`;
    }
    if (state.status === 'error') {
        return `Are you sure you want to permanently delete instance ${instanceDisplay} and everything it contains from the knowledge base?`;
    }
    const { kept, unlinked_from: unlinkedFrom } = state.preview;
    const contained = containedCount(state.preview);
    const scope = contained > 0 ? ` and the ${plural(contained, 'instance')} it contains` : '';
    const sentences = [`Are you sure you want to permanently delete instance ${instanceDisplay}${scope} from the knowledge base?`];
    if (kept.length > 0) {
        sentences.push(
            `${plural(kept.length, 'instance')} linked below it ${kept.length === 1 ? 'is' : 'are'} still reachable from elsewhere and will be kept.`,
        );
    }
    if (unlinkedFrom.length > 0) {
        sentences.push(
            `It is also linked from ${plural(unlinkedFrom.length, 'other instance')}. ${unlinkedFrom.length === 1 ? 'That link' : 'Those links'} will be removed.`,
        );
    }
    return sentences.join(' ');
};
