import userEvent from '@testing-library/user-event';
import { HTTPError } from 'ky';
import { describe, expect, it, vi } from 'vitest';

import InstanceInspector from '@/components/InstanceInspector/InstanceInspector';
import { getInstancePropertyMetadata } from '@/services/backend/instances';
import { render, screen } from '@/testUtils';
import { InstancePropertyMetadata } from '@/types/backend';

vi.mock('@/services/backend/instances', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/instances')>()),
    getInstancePropertyMetadata: vi.fn(),
}));

const mockMetadata = vi.mocked(getInstancePropertyMetadata);

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
});
