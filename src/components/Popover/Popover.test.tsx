import { createRef, useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Surface } from '../Surface';
import { Popover } from './Popover';

function Subject(props: Partial<React.ComponentProps<typeof Popover>>) {
  return (
    <Popover title="Plugins" trigger={<IconButton label="Plugins" icon="plugins" />} {...props}>
      <Button>Poll</Button>
      <Button>Timer</Button>
    </Popover>
  );
}

describe('Popover', () => {
  it('is closed until the trigger is pressed, then is a dialog named by its title', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', { name: 'Plugins' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Plugins' });
    expect(dialog).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: 'Plugins' })).toBeVisible();
  });

  it('moves focus into the dialog on open', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.click(screen.getByRole('button', { name: 'Plugins' }));
    const dialog = await screen.findByRole('dialog');
    // React Aria moves focus in a frame after the dialog mounts.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it('has a visible close button that closes it and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', { name: 'Plugins' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog');
    const close = screen.getByRole('button', { name: 'Close' });
    expect(dialog.contains(close)).toBe(true);
    await user.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', { name: 'Plugins' });
    await user.tab();
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('opens with Space on the trigger and Tab moves through its content', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.tab();
    await user.keyboard(' ');
    const dialog = await screen.findByRole('dialog');
    // The dialog itself takes focus (nothing inside autofocuses), so the
    // first Tab reaches the close button, then the content.
    await waitFor(() => expect(dialog).toHaveFocus());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Poll' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Timer' })).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the popover, wrapping at both ends', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.click(screen.getByRole('button', { name: 'Plugins' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    const close = screen.getByRole('button', { name: 'Close' });
    const last = screen.getByRole('button', { name: 'Timer' });
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(last).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The page behind the popover is hidden from assistive technology.
    const trigger = screen.getByRole('button', { name: 'Plugins', hidden: true });
    expect(trigger.closest('[aria-hidden="true"], [inert]')).not.toBeNull();
  });

  it('reports open state changes', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Subject onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button', { name: 'Plugins' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('keeps the title as the accessible name when it is hidden', () => {
    render(<Subject title="Share media" titleHidden defaultOpen />);
    expect(screen.getByRole('dialog', { name: 'Share media' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share media' })).toHaveClass('sr-only');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('always renders as a panel, even when its trigger sits on the stage, and merges a className', () => {
    render(
      <Surface kind="stage">
        <Subject defaultOpen className="w-112" />
      </Surface>,
    );
    const card = screen.getByRole('dialog').parentElement;
    expect(card).not.toHaveAttribute('data-surface');
    expect(card?.closest('[data-surface="stage"]')).toBeNull();
    expect(card).toHaveClass('w-112', 'bg-surface', 'shadow-overlay');
    expect(card).not.toHaveClass('w-panel');
  });

  it('forwards its ref to the dialog element', () => {
    const ref = createRef<HTMLElement>();
    render(<Subject defaultOpen ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });

  it('standalone: anchors to a triggerRef, is controlled, and closes on Escape and its close button', async () => {
    const user = userEvent.setup();
    function Standalone() {
      const [open, setOpen] = useState(false);
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <IconButton
            ref={triggerRef}
            label="Plugins"
            icon="plugins"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? 'plugins-dialog' : undefined}
            onPress={() => setOpen(!open)}
          />
          <Popover id="plugins-dialog" title="Plugins" triggerRef={triggerRef} isOpen={open} onOpenChange={setOpen}>
            <Button>Poll</Button>
          </Popover>
        </>
      );
    }
    render(<Standalone />);
    const trigger = screen.getByRole('button', { name: 'Plugins' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Plugins' });
    expect(dialog).toHaveAttribute('id', 'plugins-dialog');
    expect(screen.getByRole('button', { name: 'Plugins', hidden: true })).toHaveAttribute('aria-controls', 'plugins-dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
