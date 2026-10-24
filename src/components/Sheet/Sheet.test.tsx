import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Surface } from '../Surface';
import { Sheet } from './Sheet';

function Subject(props: Partial<React.ComponentProps<typeof Sheet>>) {
  return (
    <Sheet
      title="More"
      trigger={<IconButton label="More" icon="more" />}
      footer={<Button>Settings</Button>}
      {...props}
    >
      <Button>Share media</Button>
      <Button>Captions</Button>
    </Sheet>
  );
}

describe('Sheet', () => {
  it('is closed until the trigger is pressed, then is a dialog named by its title', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More' }));
    expect(await screen.findByRole('dialog', { name: 'More' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'More' })).toBeVisible();
  });

  it('moves focus into the sheet on open', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.click(screen.getByRole('button', { name: 'More' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it('keeps Tab inside the sheet', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.click(screen.getByRole('button', { name: 'More' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    const close = screen.getByRole('button', { name: 'Close' });
    const last = screen.getByRole('button', { name: 'Settings' });
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
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', { name: 'More' });
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
    const trigger = screen.getByRole('button', { name: 'More' });
    await user.tab();
    await user.keyboard(' ');
    const dialog = await screen.findByRole('dialog');
    const close = screen.getByRole('button', { name: 'Close' });
    expect(dialog.contains(close)).toBe(true);
    await user.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('is a full-width bottom sheet with a handle by default, and a side sheet at the end', () => {
    const { rerender } = render(<Subject defaultOpen />);
    let box = screen.getByRole('dialog').parentElement;
    expect(box).toHaveClass('w-full', 'rounded-t-xl');
    expect(box?.parentElement).toHaveClass('items-end', 'bg-scrim');
    expect(screen.getByRole('dialog').querySelector('[aria-hidden="true"]')).toHaveClass('rounded-full');

    rerender(<Subject defaultOpen position="end" />);
    box = screen.getByRole('dialog').parentElement;
    expect(box).toHaveClass('h-full', 'w-panel', 'rounded-l-xl');
    expect(box).not.toHaveClass('w-full', 'rounded-t-xl');
    expect(box?.parentElement).toHaveClass('justify-end');
    expect(screen.getByRole('dialog').querySelector('.rounded-full')).toBeNull();
  });

  it('stacks a sheet opened from inside another under one scrim, and closing it returns to the parent', async () => {
    const user = userEvent.setup();
    render(
      <Sheet title="People" trigger={<Button>People</Button>}>
        <Sheet title="Actions for Anton Georgiev" trigger={<Button>Anton Georgiev</Button>}>
          <Button>Make presenter</Button>
        </Sheet>
      </Sheet>,
    );
    await user.click(screen.getByRole('button', { name: 'People' }));
    const people = await screen.findByRole('dialog', { name: 'People' });
    const row = screen.getByRole('button', { name: 'Anton Georgiev' });
    await user.click(row);
    const actions = await screen.findByRole('dialog', { name: 'Actions for Anton Georgiev' });
    expect(people.parentElement?.parentElement).toHaveClass('bg-scrim');
    expect(actions.parentElement?.parentElement).toHaveClass('bg-transparent');
    expect(document.querySelectorAll('.bg-scrim')).toHaveLength(1);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Actions for Anton Georgiev' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'People' })).toBeInTheDocument();
    await waitFor(() => expect(row).toHaveFocus());
  });

  it('keeps the title as the accessible name when it is hidden, and renders header extras', () => {
    render(<Subject title="People and chat" titleHidden headerExtra={<span>14 people</span>} defaultOpen />);
    expect(screen.getByRole('dialog', { name: 'People and chat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'People and chat' })).toHaveClass('sr-only');
    expect(screen.getByText('14 people')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('renders from state alone, without a trigger', () => {
    const { rerender } = render(<Sheet title="Updates" isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<Sheet title="Updates" isOpen />);
    expect(screen.getByRole('dialog', { name: 'Updates' })).toBeInTheDocument();
  });

  it('always renders as a panel, even when opened from the stage, and merges a className', () => {
    render(
      <Surface kind="stage">
        <Subject defaultOpen className="rounded-none" />
      </Surface>,
    );
    const box = screen.getByRole('dialog').parentElement;
    expect(box?.parentElement).not.toHaveAttribute('data-surface');
    expect(box?.closest('[data-surface="stage"]')).toBeNull();
    expect(box).toHaveClass('rounded-none', 'bg-surface');
    expect(box).not.toHaveClass('rounded-t-xl');
  });

  it('reopens from its trigger after Escape when it started open, and the trigger reports aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Subject defaultOpen />);
    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    const trigger = screen.getByRole('button', { name: 'More', hidden: true });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Nothing was focused before a sheet that started open, so there is no focus to return to.
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'More' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('reports open state changes through its trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Subject onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button', { name: 'More' }));
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
