import { toast } from '@heroui/react';
import userEvent from '@testing-library/user-event';
import { HTTPError } from 'ky';
import { afterEach, describe, expect, it, vi } from 'vitest';

import InstanceInspector from '@/components/InstanceInspector/InstanceInspector';
import {
    deleteInstance,
    deleteValue,
    getInstanceDeletionPreview,
    getInstancePropertyMetadata,
    getValueDeletionPreview,
} from '@/services/backend/instances';
import { act, render, screen, waitFor } from '@/testUtils';
import { InstancePropertyMetadata } from '@/types/backend';

vi.mock('@/services/backend/instances', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/instances')>()),
    getInstancePropertyMetadata: vi.fn(),
    getInstanceDeletionPreview: vi.fn(),
    getValueDeletionPreview: vi.fn(),
    deleteValue: vi.fn(),
    deleteInstance: vi.fn(),
}));

// The inspector renders ExportKratosButton, which fetches the class hierarchy.
vi.mock('@/services/backend/classes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/classes')>()),
    getClassHierarchyMetadata: vi.fn().mockResolvedValue([]),
}));

const mockMetadata = vi.mocked(getInstancePropertyMetadata);
const mockDeleteValue = vi.mocked(deleteValue);
const mockDeleteInstance = vi.mocked(deleteInstance);
const mockDeletionPreview = vi.mocked(getInstanceDeletionPreview);
const mockUnlinkPreview = vi.mocked(getValueDeletionPreview);

const literalDeletion = { status: 'success' as const, target: null, deleted: [], kept: [] };
const keptTargetDeletion = { status: 'success' as const, target: 'instance_9', deleted: [], kept: ['instance_9'] };

const metadata: InstancePropertyMetadata = {
    id: 'instance_1',
    label: 'Fluid solver',
    types: ['solvers', 'fluid_solver'],
    properties: [
        {
            property: 'data',
            values: [{ kind: 'object', id: 'instance_9', label: 'Fluid mesh', types: ['meshes'], property_preview: [], preview_truncated: false }],
        },
        {
            property: 'solver_settings',
            values: [
                {
                    kind: 'object',
                    id: 'instance_733f1d35-6558-4d16-8066-8666b14e300a',
                    label: 'instance_733f1d35-6558-4d16-8066-8666b14e300a',
                    types: ['solver_settings'],
                    // Realistic truncated shape: the backend caps at three items.
                    property_preview: [
                        { property: 'num_steps', value: 30, kind: 'literal' },
                        { property: 'start_time', value: 0, kind: 'literal' },
                        { property: 'solver', value: 'CFD', kind: 'object' },
                    ],
                    preview_truncated: true,
                },
            ],
        },
        {
            property: 'echo_level',
            values: [{ kind: 'literal', value: 1, datatype: 'http://www.w3.org/2001/XMLSchema#integer' }],
        },
        {
            property: 'parallel_type',
            values: [{ kind: 'literal', value: 'OpenMP', datatype: 'http://www.w3.org/2001/XMLSchema#string' }],
        },
        {
            property: 'comment',
            values: [{ kind: 'literal', value: 'Ein Löser', datatype: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString', language: 'de' }],
        },
    ],
};

const httpError = (status: number, body = '') => new HTTPError(new Response(body, { status }), new Request('http://localhost/'), {} as never);
const notFoundError = () => httpError(400);

/** Preview of a leaf instance: nothing contained, nothing kept, no other links. */
const leafPreview = { instance: 'instance_1', deleted: ['instance_1'], kept: [], unlinked_from: [] };

describe('InstanceInspector', () => {
    // The toast queue is module-global; drain it so one test's toast cannot satisfy the next test's assertion.
    afterEach(() => {
        act(() => toast.clear());
    });

    it('renders the header (label, id, type chips) and the property table', async () => {
        mockMetadata.mockResolvedValue(metadata);
        render(<InstanceInspector instanceId="instance_1" />);
        expect(await screen.findByRole('heading', { name: 'Fluid solver' })).toBeInTheDocument();
        expect(screen.getByText('ID: instance_1')).toBeInTheDocument();
        expect(screen.getByText('solvers')).toBeInTheDocument();
        expect(screen.getByText('fluid_solver')).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'echo_level' })).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows object values as links labelled "label (id)" and navigates on click', async () => {
        mockMetadata.mockResolvedValue(metadata);
        const onUrlUpdate = vi.fn();
        render(<InstanceInspector instanceId="instance_1" />, { onUrlUpdate });
        await userEvent.click(await screen.findByRole('button', { name: 'Fluid mesh (instance_9)' }));
        expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get('instance')).toBe('instance_9');
    });

    it('badges non-string datatypes and language tags, but not plain strings', async () => {
        mockMetadata.mockResolvedValue(metadata);
        render(<InstanceInspector instanceId="instance_1" />);
        expect(await screen.findByText('integer')).toBeInTheDocument();
        expect(screen.getByText('de')).toBeInTheDocument();
        expect(screen.getByText('OpenMP')).toBeInTheDocument();
        expect(screen.queryByText('string')).not.toBeInTheDocument();
    });

    it('shows a message for an instance without properties', async () => {
        mockMetadata.mockResolvedValue({ id: 'instance_2', label: 'instance_2', types: [], properties: [] });
        render(<InstanceInspector instanceId="instance_2" />);
        expect(await screen.findByText('This instance has no properties defined.')).toBeInTheDocument();
    });

    it('re-targets the class when the inspected instance belongs to a different class', async () => {
        mockMetadata.mockResolvedValue({ ...metadata, id: 'instance_9', label: 'Fluid mesh', types: ['meshes'] });
        const onUrlUpdate = vi.fn();
        render(<InstanceInspector instanceId="instance_9" />, { searchParams: '?class=solvers&instance=instance_9', onUrlUpdate });
        await screen.findByRole('heading', { name: 'Fluid mesh' });
        const params = onUrlUpdate.mock.lastCall?.[0].searchParams;
        expect(params?.get('class')).toBe('meshes');
        expect(params?.get('instance')).toBe('instance_9');
    });

    it('selects the instance class when no class is selected (import, pasted URL)', async () => {
        mockMetadata.mockResolvedValue(metadata);
        const onUrlUpdate = vi.fn();
        render(<InstanceInspector instanceId="instance_1" />, { searchParams: '?instance=instance_1', onUrlUpdate });
        await screen.findByRole('heading', { name: 'Fluid solver' });
        const params = onUrlUpdate.mock.lastCall?.[0].searchParams;
        expect(params?.get('class')).toBe('solvers');
        expect(params?.get('instance')).toBe('instance_1');
    });

    it('keeps the class when the inspected instance belongs to it', async () => {
        mockMetadata.mockResolvedValue(metadata);
        const onUrlUpdate = vi.fn();
        render(<InstanceInspector instanceId="instance_1" />, { searchParams: '?class=solvers&instance=instance_1', onUrlUpdate });
        await screen.findByRole('heading', { name: 'Fluid solver' });
        expect(onUrlUpdate).not.toHaveBeenCalled();
    });

    it('describes unlabeled linked objects by class, short id, and preview', async () => {
        mockMetadata.mockResolvedValue(metadata);
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<InstanceInspector instanceId="instance_1" />, { searchParams: '?class=solvers&instance=instance_1', onUrlUpdate });
        await screen.findByRole('heading', { name: 'Fluid solver' });

        const link = screen.getByRole('button', { name: 'solver_settings · instance_733f1d…' });
        expect(link).toHaveAttribute('title', 'Navigate to instance_733f1d35-6558-4d16-8066-8666b14e300a');
        expect(screen.getByText('num_steps:')).toBeInTheDocument();
        expect(screen.getByText('· + more')).toBeInTheDocument();

        await user.click(link);
        const params = onUrlUpdate.mock.lastCall?.[0].searchParams;
        expect(params?.get('instance')).toBe('instance_733f1d35-6558-4d16-8066-8666b14e300a');
    });

    it('hides the delete affordance of every row with an open editor', async () => {
        mockMetadata.mockResolvedValue(metadata);
        const user = userEvent.setup();
        render(<InstanceInspector instanceId="instance_1" />);
        await screen.findByRole('heading', { name: 'Fluid solver' });

        await user.dblClick(screen.getByText('1'));
        await user.dblClick(screen.getByText('Ein Löser'));

        expect(screen.queryByRole('button', { name: 'Delete echo_level value 1' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete comment value Ein Löser' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete parallel_type value OpenMP' })).toBeInTheDocument();
    });

    it('shows a not-found state when the backend rejects the instance id', async () => {
        mockMetadata.mockRejectedValue(notFoundError());
        render(<InstanceInspector instanceId="gone" />);
        expect(await screen.findByText('This instance no longer exists in the knowledge base.')).toBeInTheDocument();
    });

    it('shows the error state for other failures', async () => {
        mockMetadata.mockRejectedValue(new Error('network down'));
        render(<InstanceInspector instanceId="instance_1" />);
        expect(await screen.findByText('Could not load the instance details')).toBeInTheDocument();
    });

    it('deletes a literal value after confirmation with the exact typed payload', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeleteValue.mockResolvedValue(literalDeletion);
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete echo_level value 1' }));
        expect(await screen.findByText('Are you sure you want to delete echo_level "1"?')).toBeInTheDocument();
        // Literals link nothing, so no unlink preview is fetched.
        expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
        expect(mockUnlinkPreview).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(mockDeleteValue).toHaveBeenCalledWith('instance_1', 'echo_level', {
            kind: 'literal',
            value: 1,
            datatype: 'http://www.w3.org/2001/XMLSchema#integer',
        });
        expect(await screen.findByText('Deleted echo_level "1"')).toBeInTheDocument();
    });

    it('deletes an object value with the object-target payload once the preview says the target stays', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockUnlinkPreview.mockResolvedValue({ target: 'instance_9', deleted: [], kept: ['instance_9'] });
        mockDeleteValue.mockResolvedValue(keptTargetDeletion);
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete data value Fluid mesh (instance_9)' }));
        expect(
            await screen.findByText(
                'Are you sure you want to delete data "Fluid mesh (instance_9)"? The linked instance stays in the knowledge base.',
            ),
        ).toBeInTheDocument();
        expect(mockUnlinkPreview).toHaveBeenCalledWith('instance_1', 'data', 'instance_9');
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(mockDeleteValue).toHaveBeenCalledWith('instance_1', 'data', { kind: 'object', id: 'instance_9' });
        expect(await screen.findByText('Deleted data "Fluid mesh (instance_9)"')).toBeInTheDocument();
    });

    it('spells out the collection of an orphaned link target and reports it afterwards', async () => {
        mockMetadata.mockResolvedValue(metadata);
        // The holder (instance_1) reached through a back-link is kept but never counted.
        const collected = { target: 'instance_9', deleted: ['instance_9', 'instance_10'], kept: ['instance_1'] };
        mockUnlinkPreview.mockResolvedValue(collected);
        mockDeleteValue.mockResolvedValue({ status: 'success', ...collected });
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete data value Fluid mesh (instance_9)' }));
        expect(
            await screen.findByText(
                'Are you sure you want to delete data "Fluid mesh (instance_9)"? Nothing else links to the linked instance, so it will be deleted as well, together with the 1 instance it contains.',
            ),
        ).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(
            await screen.findByText('Deleted data "Fluid mesh (instance_9)" and the linked instance with 1 contained instance'),
        ).toBeInTheDocument();
    });

    it('keeps the value dialog open and reports the backend error when the deletion fails', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockUnlinkPreview.mockResolvedValue({ target: 'instance_9', deleted: [], kept: ['instance_9'] });
        mockDeleteValue.mockRejectedValue(new Error('GraphDB unavailable'));
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete data value Fluid mesh (instance_9)' }));
        await screen.findByText(/The linked instance stays in the knowledge base\./);
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(await screen.findByText('GraphDB unavailable')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
        expect(mockUnlinkPreview).toHaveBeenCalledTimes(1);
    });

    it('asks the plain question and removes only the link when the backend has no preview route (older backend)', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockUnlinkPreview.mockRejectedValue(httpError(404, '<html>Not Found</html>'));
        mockDeleteValue.mockResolvedValue(literalDeletion);
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete data value Fluid mesh (instance_9)' }));
        expect(await screen.findByText('Are you sure you want to delete data "Fluid mesh (instance_9)"?')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(mockDeleteValue).toHaveBeenCalledWith('instance_1', 'data', { kind: 'object', id: 'instance_9' });
        expect(await screen.findByText('Deleted data "Fluid mesh (instance_9)"')).toBeInTheDocument();
    });

    it('blocks confirming an object value deletion while its preview is still loading', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockUnlinkPreview.mockReturnValue(new Promise(() => undefined));
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete data value Fluid mesh (instance_9)' }));
        expect(await screen.findByText('Checking what deleting data "Fluid mesh (instance_9)" would remove…')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
        expect(mockDeleteValue).not.toHaveBeenCalled();
    });

    it('falls back to a generic cascade warning when the unlink preview fails', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockUnlinkPreview.mockRejectedValue(new Error('GraphDB unavailable'));
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete data value Fluid mesh (instance_9)' }));
        expect(
            await screen.findByText(/If nothing else links to it, the linked instance and everything it contains will be deleted as well\./),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    });

    it('closes the value dialog and explains when the backend refuses the unlink preview', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockUnlinkPreview.mockRejectedValue(httpError(400, JSON.stringify({ error: 'Subject instance instance_1 does not exist in GraphDB.' })));
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete data value Fluid mesh (instance_9)' }));
        expect(await screen.findByText('Subject instance instance_1 does not exist in GraphDB.')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument());
    });

    it('includes the language tag when deleting a language-tagged literal', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeleteValue.mockResolvedValue(literalDeletion);
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete comment value Ein Löser' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(mockDeleteValue).toHaveBeenCalledWith('instance_1', 'comment', {
            kind: 'literal',
            value: 'Ein Löser',
            datatype: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
            language: 'de',
        });
    });

    it('does not delete when the confirmation is cancelled', async () => {
        mockMetadata.mockResolvedValue(metadata);
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete echo_level value 1' }));
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(mockDeleteValue).not.toHaveBeenCalled();
    });

    it('deletes the instance after confirmation, clears the selection, and never refetches it', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeletionPreview.mockResolvedValue(leafPreview);
        mockDeleteInstance.mockResolvedValue({ status: 'success', ...leafPreview });
        const onUrlUpdate = vi.fn();
        render(<InstanceInspector instanceId="instance_1" />, { searchParams: '?class=solvers&instance=instance_1', onUrlUpdate });
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        expect(await screen.findByText(/permanently delete instance "Fluid solver" \(instance_1\) from the knowledge base/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(mockDeleteInstance).toHaveBeenCalledWith('instance_1');
        await waitFor(() => expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get('instance')).toBeNull());
        expect(mockMetadata).toHaveBeenCalledTimes(1);
    });

    it('spells out the cascade before deleting and reports the count afterwards', async () => {
        mockMetadata.mockResolvedValue(metadata);
        const cascade = {
            instance: 'instance_1',
            deleted: ['instance_1', 'instance_9', 'instance_733f1d35-6558-4d16-8066-8666b14e300a'],
            kept: ['instance_5'],
            unlinked_from: ['instance_7'],
        };
        mockDeletionPreview.mockResolvedValue(cascade);
        mockDeleteInstance.mockResolvedValue({ status: 'success', ...cascade });
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        expect(
            await screen.findByText(
                /and the 2 instances it contains from the knowledge base\? 1 instance linked below it is still reachable from elsewhere and will be kept\. It is also linked from 1 other instance\. That link will be removed\./,
            ),
        ).toBeInTheDocument();
        expect(mockDeletionPreview).toHaveBeenCalledWith('instance_1');
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(await screen.findByText(/deleted with 2 contained instances/)).toBeInTheDocument();
    });

    it('fetches a fresh preview every time the dialog is reopened', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeletionPreview.mockResolvedValue(leafPreview);
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        expect(await screen.findByText(/permanently delete instance "Fluid solver" \(instance_1\) from the knowledge base/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete instance' }));
        expect(await screen.findByText(/permanently delete instance "Fluid solver" \(instance_1\) from the knowledge base/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
        expect(mockDeletionPreview).toHaveBeenCalledTimes(2);
    });

    it('blocks confirming while the preview is still loading', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeletionPreview.mockReturnValue(new Promise(() => undefined));
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        expect(await screen.findByText(/Checking what deleting instance/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
        expect(mockDeleteInstance).not.toHaveBeenCalled();
    });

    it('falls back to a generic cascade warning when the preview fails', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeletionPreview.mockRejectedValue(new Error('GraphDB unavailable'));
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        expect(await screen.findByText(/and everything it contains from the knowledge base\?/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    });

    it('shows the not-found state when the preview reveals the instance is already gone', async () => {
        mockMetadata.mockResolvedValueOnce(metadata).mockRejectedValue(notFoundError());
        mockDeletionPreview.mockRejectedValue(notFoundError());
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        expect(await screen.findByText('This instance no longer exists in the knowledge base.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('closes the dialog and explains when the backend refuses the deletion but the entry still loads', async () => {
        mockMetadata.mockResolvedValue(metadata);
        const refused = httpError(400, JSON.stringify({ error: 'Instance instance_1 does not exist in GraphDB.' }));
        mockDeletionPreview.mockRejectedValue(refused);
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        expect(await screen.findByText('Instance instance_1 does not exist in GraphDB.')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument());
        expect(screen.getByRole('heading', { name: 'Fluid solver' })).toBeInTheDocument();
    });

    it('keeps the dialog open and reports the backend error when deletion fails', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeletionPreview.mockResolvedValue(leafPreview);
        mockDeleteInstance.mockRejectedValue(new Error('GraphDB unavailable'));
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        // The dialog stays open for a retry; no navigation happened.
        expect(await screen.findByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
});
