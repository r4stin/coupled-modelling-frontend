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

/** A confirmation: the question, then each consequence on its own line. */
export type DialogMessage = { text: string; consequences: string[] };

const question = (subject: string, withContents: boolean) => `Permanently delete ${subject}${withContents ? ' and everything it contains' : ''}?`;

const containedLine = (count: number) => `${plural(count, 'contained instance')} will be deleted with it.`;

// "Below it": children of the deleted subtree that survive, as opposed to the instances linking to it.
const keptLine = (count: number) =>
    `${plural(count, 'instance')} below it ${count === 1 ? 'stays' : 'stay'}, since ${count === 1 ? 'it is' : 'they are'} still used elsewhere.`;

// Counts the linking instances, not their links: one instance may link through several properties.
const unlinkedLine = (count: number) =>
    count === 1 ? '1 link from another instance will be removed.' : `Links from ${count} other instances will be removed.`;

/** Confirmation for an instance deletion; the cascade scope is spelled out once the preview is known. */
export const deletionMessage = (instanceDisplay: string, state: DeletionPreviewState): DialogMessage => {
    if (state.status === 'loading') {
        return { text: `Checking what deleting ${instanceDisplay} would remove…`, consequences: [] };
    }
    if (state.status === 'error') {
        return {
            text: question(instanceDisplay, false),
            consequences: ['What it contains could not be checked; everything it contains will be deleted with it.'],
        };
    }
    const { instance, deleted, kept, unlinked_from: unlinkedFrom } = state.preview;
    const contained = containedCount(instance, deleted);
    const consequences: string[] = [];
    if (contained > 0) {
        consequences.push(containedLine(contained));
    }
    if (kept.length > 0) {
        consequences.push(keptLine(kept.length));
    }
    if (unlinkedFrom.length > 0) {
        consequences.push(unlinkedLine(unlinkedFrom.length));
    }
    return { text: question(instanceDisplay, contained > 0), consequences };
};

/** Confirmation for deleting a value; `state` is null for literals, and the holder is never counted among the kept instances. */
export const unlinkMessage = (property: string, valueDisplay: string, holderId: string, state: UnlinkPreviewState | null): DialogMessage => {
    const text = question(`${property} "${valueDisplay}"`, false);
    if (state === null || state.status === 'unsupported') {
        return { text, consequences: [] };
    }
    if (state.status === 'loading') {
        return { text: `Checking what deleting ${property} "${valueDisplay}" would remove…`, consequences: [] };
    }
    if (state.status === 'error') {
        return {
            text,
            consequences: [
                'What it links to could not be checked; if nothing else links to it, the linked instance and everything it contains will be deleted as well.',
            ],
        };
    }
    const { target, deleted, kept } = state.preview;
    if (deleted.length === 0) {
        const stays = target !== null && kept.includes(target);
        return {
            text,
            consequences: [stays ? 'The linked instance itself is kept; only the link will be removed.' : 'Only the link will be removed.'],
        };
    }
    const contained = containedCount(target, deleted);
    const keptElsewhere = kept.filter((id) => id !== holderId).length;
    const consequences = ['Nothing else links to the linked instance, so it will be deleted as well.'];
    if (contained > 0) {
        consequences.push(containedLine(contained));
    }
    if (keptElsewhere > 0) {
        consequences.push(keptLine(keptElsewhere));
    }
    return { text, consequences };
};
