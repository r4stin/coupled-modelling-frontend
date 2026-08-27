import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import EditableLiteralValue from '@/components/InstanceInspector/EditableLiteralValue';
import { XSD_BOOLEAN } from '@/lib/literalParsing';
import { replaceValue } from '@/services/backend/instances';
import { render, screen } from '@/testUtils';
import { LiteralPropertyValue } from '@/types/backend';

vi.mock('@/services/backend/instances', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/services/backend/instances')>()),
    replaceValue: vi.fn(),
}));

const mockReplaceValue = vi.mocked(replaceValue);

const literal: LiteralPropertyValue = { kind: 'literal', value: 1, datatype: 'http://www.w3.org/2001/XMLSchema#integer' };

const startEdit = async (value: LiteralPropertyValue = literal, onSaved = vi.fn()) => {
    render(<EditableLiteralValue instanceId="instance_1" property="echo_level" value={value} onSaved={onSaved} />);
    await userEvent.dblClick(screen.getByText(String(value.value)));
    return onSaved;
};

describe('EditableLiteralValue', () => {
    it('opens an editor on double-click, prefilled with the current value', async () => {
        await startEdit();
        expect(screen.getByRole('textbox', { name: 'Edit echo_level value 1' })).toHaveValue('1');
    });

    it('opens the editor with the keyboard (Enter on the focused value)', async () => {
        render(<EditableLiteralValue instanceId="instance_1" property="echo_level" value={literal} onSaved={vi.fn()} />);
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('replaces the value atomically, preserving the datatype', async () => {
        mockReplaceValue.mockResolvedValue(undefined as never);
        const onSaved = await startEdit();
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, '5{Enter}');
        expect(mockReplaceValue).toHaveBeenCalledWith(
            'instance_1',
            'echo_level',
            { kind: 'literal', value: 1, datatype: 'http://www.w3.org/2001/XMLSchema#integer' },
            { kind: 'literal', value: 5, datatype: 'http://www.w3.org/2001/XMLSchema#integer' },
        );
        expect(onSaved).toHaveBeenCalled();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('preserves the language tag on both sides when editing a language-tagged literal', async () => {
        mockReplaceValue.mockResolvedValue(undefined as never);
        const tagged: LiteralPropertyValue = {
            kind: 'literal',
            value: 'Ein Löser',
            datatype: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
            language: 'de',
        };
        render(<EditableLiteralValue instanceId="instance_1" property="comment" value={tagged} onSaved={vi.fn()} />);
        await userEvent.dblClick(screen.getByText('Ein Löser'));
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, 'Ein Solver{Enter}');
        expect(mockReplaceValue).toHaveBeenCalledWith(
            'instance_1',
            'comment',
            expect.objectContaining({ language: 'de' }),
            expect.objectContaining({ value: 'Ein Solver', language: 'de' }),
        );
    });

    it('rejects invalid numeric input without calling the backend', async () => {
        await startEdit();
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, 'abc{Enter}');
        expect(mockReplaceValue).not.toHaveBeenCalled();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('edits booleans with a true/false select instead of free text', async () => {
        mockReplaceValue.mockResolvedValue(new Response() as never);
        const boolean: LiteralPropertyValue = { kind: 'literal', value: true, datatype: XSD_BOOLEAN };
        const onSaved = await startEdit(boolean);

        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /edit echo_level value true/i }));
        await userEvent.click(await screen.findByRole('option', { name: 'false' }));
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(mockReplaceValue).toHaveBeenCalledWith(
            'instance_1',
            'echo_level',
            { kind: 'literal', value: true, datatype: XSD_BOOLEAN },
            { kind: 'literal', value: false, datatype: XSD_BOOLEAN },
        );
        expect(onSaved).toHaveBeenCalled();
    });

    it('cancels with Escape without saving', async () => {
        await startEdit();
        await userEvent.keyboard('{Escape}');
        expect(mockReplaceValue).not.toHaveBeenCalled();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('keeps the editor open and reports the error when the replace fails', async () => {
        mockReplaceValue.mockRejectedValue(new Error('GraphDB unavailable'));
        const onSaved = await startEdit();
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, '5{Enter}');
        expect(onSaved).not.toHaveBeenCalled();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
});
