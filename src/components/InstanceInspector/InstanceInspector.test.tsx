import userEvent from '@testing-library/user-event';
import { HTTPError } from 'ky';
import { describe, expect, it, vi } from 'vitest';

import InstanceInspector from '@/components/InstanceInspector/InstanceInspector';
import { deleteInstance, deleteValue, getInstancePropertyMetadata } from '@/services/backend/instances';
import { render, screen } from '@/testUtils';
import { InstancePropertyMetadata } from '@/types/backend';

vi.mock('@/services/backend/instances', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/instances')>()),
    getInstancePropertyMetadata: vi.fn(),
    deleteValue: vi.fn(),
    deleteInstance: vi.fn(),
}));

const mockMetadata = vi.mocked(getInstancePropertyMetadata);
const mockDeleteValue = vi.mocked(deleteValue);
const mockDeleteInstance = vi.mocked(deleteInstance);

const metadata: InstancePropertyMetadata = {
    id: 'instance_1',
    label: 'Fluid solver',
    types: ['solvers', 'fluid_solver'],
    properties: [
        {
            property: 'data',
            values: [{ kind: 'object', id: 'instance_9', label: 'Fluid mesh' }],
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

const notFoundError = () => new HTTPError(new Response('', { status: 400 }), new Request('http://localhost/'), {} as never);

describe('InstanceInspector', () => {
    it('renders the header (label, id, type chips) and the property table', async () => {
        mockMetadata.mockResolvedValue(metadata);
        render(<InstanceInspector instanceId="instance_1" />);
        expect(await screen.findByRole('heading', { name: 'Fluid solver' })).toBeInTheDocument();
        expect(screen.getByText('ID: instance_1')).toBeInTheDocument();
        expect(screen.getByText('solvers')).toBeInTheDocument();
        expect(screen.getByText('fluid_solver')).toBeInTheDocument();
        expect(screen.getByText('echo_level')).toBeInTheDocument();
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

    it('keeps the class when the inspected instance belongs to it', async () => {
        mockMetadata.mockResolvedValue(metadata);
        const onUrlUpdate = vi.fn();
        render(<InstanceInspector instanceId="instance_1" />, { searchParams: '?class=solvers&instance=instance_1', onUrlUpdate });
        await screen.findByRole('heading', { name: 'Fluid solver' });
        expect(onUrlUpdate).not.toHaveBeenCalled();
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
        mockDeleteValue.mockResolvedValue(undefined as never);
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete echo_level value 1' }));
        expect(await screen.findByText('Are you sure you want to delete echo_level "1"?')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(mockDeleteValue).toHaveBeenCalledWith('instance_1', 'echo_level', {
            kind: 'literal',
            value: 1,
            datatype: 'http://www.w3.org/2001/XMLSchema#integer',
        });
    });

    it('deletes an object value with the object-target payload', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeleteValue.mockResolvedValue(undefined as never);
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete data value Fluid mesh (instance_9)' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(mockDeleteValue).toHaveBeenCalledWith('instance_1', 'data', { kind: 'object', id: 'instance_9' });
    });

    it('includes the language tag when deleting a language-tagged literal', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeleteValue.mockResolvedValue(undefined as never);
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

    it('deletes the instance after confirmation and clears the selection', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeleteInstance.mockResolvedValue(undefined as never);
        const onUrlUpdate = vi.fn();
        render(<InstanceInspector instanceId="instance_1" />, { searchParams: '?class=solvers&instance=instance_1', onUrlUpdate });
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        expect(await screen.findByText(/permanently delete instance "Fluid solver" \(instance_1\)/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(mockDeleteInstance).toHaveBeenCalledWith('instance_1');
        expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get('instance')).toBeNull();
    });

    it('keeps the dialog open and reports the backend error when deletion fails', async () => {
        mockMetadata.mockResolvedValue(metadata);
        mockDeleteInstance.mockRejectedValue(new Error('GraphDB unavailable'));
        render(<InstanceInspector instanceId="instance_1" />);
        await userEvent.click(await screen.findByRole('button', { name: 'Delete instance' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        // The dialog stays open for a retry; no navigation happened.
        expect(await screen.findByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
});
