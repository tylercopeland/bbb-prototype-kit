import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Surface } from '../Surface';
import { ConfirmDialog, Dialog } from './Dialog';

function Subject(props: Partial<React.ComponentProps<typeof Dialog>>) {
  return (
    <Dialog
      title="Share your screen"
      trigger={<Button>Share</Button>}
      footer={({ close }) => (
        <>
          <Button onPress={close}>Cancel</Button>
          <Button variant="primary">Start sharing</Button>
        </>
      )}
      {...props}
    >
      <Button>Entire screen</Button>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('is closed until the trigger is pressed, then is a dialog named by its title', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByRole('dialog', { name: 'Share your screen' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share your screen' })).toBeVisible();
  });

  it('moves focus into the dialog on open', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.click(screen.getByRole('button', { name: 'Share' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it('keeps Tab inside the dialog in both directions', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.click(screen.getByRole('button', { name: 'Share' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    const close = screen.getByRole('button', { name: 'Close' });
    const last = screen.getByRole('button', { name: 'Start sharing' });
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(last).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
    // The page behind the dialog is hidden from assistive technology.
    const trigger = screen.getByRole('button', { name: 'Share', hidden: true });
    expect(trigger).not.toHaveFocus();
    expect(trigger.closest('[aria-hidden="true"], [inert]')).not.toBeNull();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', { name: 'Share' });
    await user.tab();
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('has a visible close button that closes it and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', { name: 'Share' });
    await user.tab();
    await user.keyboard(' ');
    const dialog = await screen.findByRole('dialog');
    const close = screen.getByRole('button', { name: 'Close' });
    expect(dialog.contains(close)).toBe(true);
    await user.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('gives footer actions a close function', async () => {
    const user = userEvent.setup();
    render(<Subject defaultOpen />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('links the description and renders the kicker', () => {
    render(
      <Subject defaultOpen kicker="Wrapping up" kickerTone="hand" description="Students see a countdown." />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleDescription('Students see a countdown.');
    expect(screen.getByText('Wrapping up')).toHaveClass('uppercase', 'text-status-hand-text');
  });

  it('renders from state alone, without a trigger', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Dialog title="Reconnecting" isOpen={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<Dialog title="Reconnecting" isOpen onOpenChange={onOpenChange} />);
    expect(screen.getByRole('dialog', { name: 'Reconnecting' })).toBeInTheDocument();
  });

  it('always renders as a panel, even when opened from the stage, and merges a className onto the box', () => {
    render(
      <Surface kind="stage">
        <Subject defaultOpen className="max-w-panel" />
      </Surface>,
    );
    const box = screen.getByRole('dialog').parentElement;
    expect(box?.parentElement).not.toHaveAttribute('data-surface');
    expect(box?.closest('[data-surface="stage"]')).toBeNull();
    expect(box).toHaveClass('max-w-panel', 'bg-surface', 'shadow-overlay');
    expect(box).not.toHaveClass('max-w-104');
  });

  it('shows a panel tooltip on its close button when opened from the stage', async () => {
    const user = userEvent.setup();
    render(
      <Surface kind="stage">
        <Subject defaultOpen />
      </Surface>,
    );
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    // The modal hides everything outside it, including the tooltip's portal, from assistive technology.
    const tooltip = await screen.findByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveTextContent('Close');
    expect(tooltip).not.toHaveAttribute('data-surface');
    expect(tooltip.closest('[data-surface="stage"]')).toBeNull();
  });

  it('reopens from its trigger after Escape when it started open, and the trigger reports aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Subject defaultOpen />);
    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    const trigger = screen.getByRole('button', { name: 'Share', hidden: true });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Nothing was focused before a dialog that started open, so there is no focus to return to.
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Share your screen' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('reports open state changes through its trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Subject onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button', { name: 'Share' }));
    await screen.findByRole('dialog');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it('forwards its ref to the dialog element', () => {
    const ref = createRef<HTMLElement>();
    render(<Subject defaultOpen ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });
});

describe('ConfirmDialog', () => {
  function Leave(props: Partial<React.ComponentProps<typeof ConfirmDialog>>) {
    return (
      <ConfirmDialog
        title="Leave the session?"
        description="You can rejoin from the same link."
        confirmLabel="Leave session"
        tone="danger"
        onConfirm={() => {}}
        trigger={<IconButton label="Leave session" icon="leave" />}
        {...props}
      />
    );
  }

  it('is an alertdialog whose Cancel button takes focus first', async () => {
    const user = userEvent.setup();
    render(<Leave />);
    await user.click(screen.getByRole('button', { name: 'Leave session' }));
    expect(await screen.findByRole('alertdialog', { name: 'Leave the session?' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
  });

  it('confirms with Enter on the primary action and closes', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Leave onConfirm={onConfirm} defaultOpen />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Leave session' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('cancels with Escape without confirming, and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<Leave onConfirm={onConfirm} onCancel={onCancel} />);
    const trigger = screen.getByRole('button', { name: 'Leave session' });
    await user.click(trigger);
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('calls onCancel from the Cancel button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Leave onCancel={onCancel} defaultOpen />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('colors the confirming action by tone', () => {
    render(<Leave defaultOpen />);
    expect(screen.getByRole('button', { name: 'Leave session' })).toHaveClass('bg-danger', 'text-on-danger');
  });
});
