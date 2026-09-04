import { describe, expect, it, vi } from 'vitest';

import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import { render, screen } from '@/testUtils';

const renderDialog = (message: string, isPending: boolean) => (
    <ConfirmDialog isOpen title="Delete value" message={message} isPending={isPending} onConfirm={vi.fn()} onCancel={vi.fn()} />
);

describe('ConfirmDialog', () => {
    it('follows message changes while idle but freezes the confirmed text while the action runs', () => {
        const { rerender } = render(renderDialog('Checking…', false));
        rerender(renderDialog('Delete the linked instance too?', false));
        expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete the linked instance too?');

        rerender(renderDialog('Checking…', true));
        expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete the linked instance too?');
        expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();

        rerender(renderDialog('Something else', false));
        expect(screen.getByRole('alertdialog')).toHaveTextContent('Something else');
    });
});
