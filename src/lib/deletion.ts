import { InstanceDeletionPreview, UnlinkResult } from '@/types/backend';

export const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** Fills in fields an older backend build may omit, so a version mismatch degrades to a plain confirmation instead of a crash. */
export const normalizeDeletionPreview = (instance: string, raw: Partial<InstanceDeletionPreview> | null | undefined): InstanceDeletionPreview => ({
    instance: raw?.instance ?? instance,
    deleted: raw?.deleted ?? [instance],
    kept: raw?.kept ?? [],
    unlinked_from: raw?.unlinked_from ?? [],
});

/** Same for a value deletion; an older backend answers with an empty body and never collects anything. */
export const normalizeUnlinkResult = (raw: Partial<UnlinkResult> | null | undefined): UnlinkResult => ({
    target: raw?.target ?? null,
    deleted: raw?.deleted ?? [],
    kept: raw?.kept ?? [],
});

/** Instances removed besides the root of the collected subtree. */
export const containedCount = (root: string | null, deleted: string[]) => deleted.filter((id) => id !== root).length;

export type PreviewState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; preview: T };
export type DeletionPreviewState = PreviewState<InstanceDeletionPreview>;
/** `unsupported`: a backend without the value-preview route, which then never cascades either. */
export type UnlinkPreviewState = PreviewState<UnlinkResult> | { status: 'unsupported' };

/** Folds an SWR result into the dialog state; a refusal keeps "loading" because its handler closes the dialog. */
export const toPreviewState = <T>(data: T | undefined, error: unknown, isRefusal: (error: unknown) => boolean): PreviewState<T> =>
    data ? { status: 'ready', preview: data } : error && !isRefusal(error) ? { status: 'error' } : { status: 'loading' };

const keptSentence = (count: number) =>
    `${plural(count, 'instance')} linked below it ${count === 1 ? 'is' : 'are'} still reachable from elsewhere and will be kept.`;

/** Confirmation text for an instance deletion; the cascade scope is spelled out once the preview is known. */
export const deletionMessage = (instanceDisplay: string, state: DeletionPreviewState) => {
    if (state.status === 'loading') {
        return `Checking what deleting instance ${instanceDisplay} would remove…`;
    }
    if (state.status === 'error') {
        return `Are you sure you want to permanently delete instance ${instanceDisplay} and everything it contains from the knowledge base?`;
    }
    const { instance, deleted, kept, unlinked_from: unlinkedFrom } = state.preview;
    const contained = containedCount(instance, deleted);
    const scope = contained > 0 ? ` and the ${plural(contained, 'instance')} it contains` : '';
    const sentences = [`Are you sure you want to permanently delete instance ${instanceDisplay}${scope} from the knowledge base?`];
    if (kept.length > 0) {
        sentences.push(keptSentence(kept.length));
    }
    if (unlinkedFrom.length > 0) {
        sentences.push(
            `It is also linked from ${plural(unlinkedFrom.length, 'other instance')}. ${unlinkedFrom.length === 1 ? 'That link' : 'Those links'} will be removed.`,
        );
    }
    return sentences.join(' ');
};

/** Confirmation text for deleting a value; `state` is null for literals, and the holder is never counted among the kept instances. */
export const unlinkMessage = (property: string, valueDisplay: string, holderId: string, state: UnlinkPreviewState | null) => {
    const question = `Are you sure you want to delete ${property} "${valueDisplay}"?`;
    if (state === null || state.status === 'unsupported') {
        return question;
    }
    if (state.status === 'loading') {
        return `Checking what deleting ${property} "${valueDisplay}" would remove…`;
    }
    if (state.status === 'error') {
        return `${question} If nothing else links to it, the linked instance and everything it contains will be deleted as well.`;
    }
    const { target, deleted, kept } = state.preview;
    if (deleted.length === 0) {
        return `${question} ${target !== null && kept.includes(target) ? 'The linked instance stays in the knowledge base.' : 'Only the link is removed.'}`;
    }
    const contained = containedCount(target, deleted);
    const keptElsewhere = kept.filter((id) => id !== holderId).length;
    const sentences = [
        question,
        `Nothing else links to the linked instance, so it will be deleted as well${contained > 0 ? `, together with the ${plural(contained, 'instance')} it contains` : ''}.`,
    ];
    if (keptElsewhere > 0) {
        sentences.push(keptSentence(keptElsewhere));
    }
    return sentences.join(' ');
};
