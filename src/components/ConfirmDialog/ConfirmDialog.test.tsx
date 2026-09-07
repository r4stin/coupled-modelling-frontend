import { describe, expect, it, vi } from 'vitest';

import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import { render, screen } from '@/testUtils';

const renderDialog = (message: string, isPending: boolean, consequences?: string[]) => (
    <ConfirmDialog
        isOpen
        title="Delete value"
        message={message}
        consequences={consequences}
        isPending={isPending}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
    />
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

    it('lists the consequences below the question and describes the dialog by both', () => {
        const { rerender } = render(renderDialog('Checking…', false));
        expect(screen.queryByRole('list')).toBeNull();

        rerender(
            renderDialog('Permanently delete "X"?', false, ['2 contained instances will be deleted with it.', 'Only the link will be removed.']),
        );
        const items = screen.getAllByRole('listitem');
        expect(items.map((item) => item.textContent)).toEqual(['2 contained instances will be deleted with it.', 'Only the link will be removed.']);
        expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
            /Permanently delete "X"\?.*2 contained instances.*Only the link will be removed\./,
        );

        // The list is frozen with the message while the action runs, and follows again once idle.
        rerender(renderDialog('Checking…', true, []));
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        rerender(renderDialog('Permanently delete echo_level "1"?', false, []));
        expect(screen.queryByRole('list')).toBeNull();
        expect(screen.getByRole('alertdialog')).toHaveTextContent('Permanently delete echo_level "1"?');
    });
});
