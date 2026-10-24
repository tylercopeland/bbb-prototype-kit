import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Key, Selection } from 'react-aria-components';
import { IconButton } from '../IconButton';
import { Surface } from '../Surface';
import { Menu, MenuItem, MenuSection, MenuSeparator, Submenu } from './Menu';

function Subject({
  onAction,
  ...props
}: Partial<React.ComponentProps<typeof Menu>> & { onAction?: (key: Key) => void }) {
  const [flags, setFlags] = useState<Selection>(new Set(['whiteboard']));
  return (
    <Menu
      trigger={<IconButton label="More actions for Anton Georgiev" icon="more" />}
      onAction={onAction}
      {...props}
    >
      <MenuItem id="presenter" icon="presenter">
        Make presenter
      </MenuItem>
      <MenuItem id="camera" icon="cameraOff">
        Turn off camera
      </MenuItem>
      <MenuSeparator />
      <MenuSection selectionMode="multiple" selectedKeys={flags} onSelectionChange={setFlags}>
        <MenuItem id="whiteboard" icon="whiteboardAccess">
          Whiteboard access
        </MenuItem>
        <MenuItem id="moderator" icon="moderator">
          Moderator
        </MenuItem>
      </MenuSection>
      <MenuSeparator />
      <Submenu label="Move to…" icon="breakouts" onAction={onAction}>
        <MenuItem id="room-1">Room 1</MenuItem>
        <MenuItem id="room-2">Room 2</MenuItem>
      </Submenu>
      <MenuItem id="remove" icon="removeFromSession" tone="danger">
        Remove from session
      </MenuItem>
    </Menu>
  );
}

const TRIGGER = { name: 'More actions for Anton Georgiev' };

describe('Menu', () => {
  it('is closed until the trigger is pressed, then is a menu named by its trigger', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', TRIGGER);
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(trigger);
    expect(await screen.findByRole('menu', TRIGGER)).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual([
      'Make presenter',
      'Turn off camera',
      'Move to…',
      'Remove from session',
    ]);
  });

  it('opens with Enter and focuses the first item; arrows move and Escape returns focus', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', TRIGGER);
    await user.tab();
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Make presenter' })).toHaveFocus());
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Turn off camera' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('opens with Space and acts with Enter, then closes and returns focus', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Subject onAction={onAction} />);
    const trigger = screen.getByRole('button', TRIGGER);
    await user.tab();
    await user.keyboard(' ');
    await screen.findByRole('menu');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Make presenter' })).toHaveFocus());
    await user.keyboard('{Enter}');
    expect(onAction.mock.calls[0]?.[0]).toBe('presenter');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('exposes switches as checkbox items whose state is announced and toggles with Space (X9)', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.click(screen.getByRole('button', TRIGGER));
    await screen.findByRole('menu');
    const whiteboard = screen.getByRole('menuitemcheckbox', { name: 'Whiteboard access' });
    const moderator = screen.getByRole('menuitemcheckbox', { name: 'Moderator' });
    expect(whiteboard).toHaveAttribute('aria-checked', 'true');
    expect(moderator).toHaveAttribute('aria-checked', 'false');
    expect(whiteboard.querySelector('[aria-hidden="true"] > span')).toHaveClass('translate-x-4');

    await user.click(moderator);
    expect(moderator).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    moderator.focus();
    await user.keyboard(' ');
    expect(moderator).toHaveAttribute('aria-checked', 'false');
    expect(moderator).toHaveAccessibleName('Moderator');
  });

  it('opens the "Move to…" submenu with ArrowRight and acts on its items', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Subject onAction={onAction} />);
    await user.click(screen.getByRole('button', TRIGGER));
    await screen.findByRole('menu');
    const moveTo = screen.getByRole('menuitem', { name: 'Move to…' });
    expect(moveTo).toHaveAttribute('aria-haspopup', 'menu');
    expect(moveTo.querySelector('[data-icon="submenu"]')).not.toBeNull();
    moveTo.focus();
    await user.keyboard('{ArrowRight}');
    const submenu = await screen.findByRole('menu', { name: 'Move to…' });
    await waitFor(() => expect(submenu.contains(document.activeElement)).toBe(true));
    await user.keyboard('{Enter}');
    expect(onAction.mock.calls[0]?.[0]).toBe('room-1');
  });

  it('leaves the "Move to…" submenu with ArrowLeft or Escape, back to its row, with the menu still open (B2)', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.click(screen.getByRole('button', TRIGGER));
    await screen.findByRole('menu');
    const moveTo = screen.getByRole('menuitem', { name: 'Move to…' });
    for (const key of ['{ArrowLeft}', '{Escape}']) {
      moveTo.focus();
      await user.keyboard('{ArrowRight}');
      const submenu = await screen.findByRole('menu', { name: 'Move to…' });
      await waitFor(() => expect(submenu.contains(document.activeElement)).toBe(true));
      await user.keyboard(key);
      await waitFor(() => expect(screen.queryByRole('menu', { name: 'Move to…' })).not.toBeInTheDocument());
      expect(screen.getByRole('menu', TRIGGER)).toBeInTheDocument();
      expect(moveTo).toHaveFocus();
    }
  });

  it('returns focus to the ⋯ trigger after choosing a room (B2)', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Subject onAction={onAction} />);
    const trigger = screen.getByRole('button', TRIGGER);
    await user.click(trigger);
    await screen.findByRole('menu');
    screen.getByRole('menuitem', { name: 'Move to…' }).focus();
    await user.keyboard('{ArrowRight}');
    const submenu = await screen.findByRole('menu', { name: 'Move to…' });
    await waitFor(() => expect(submenu.contains(document.activeElement)).toBe(true));
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Room 2' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onAction.mock.calls[0]?.[0]).toBe('room-2');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('keeps Tab inside while open', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.click(screen.getByRole('button', TRIGGER));
    const menu = await screen.findByRole('menu');
    screen.getByRole('menuitem', { name: 'Make presenter' }).focus();
    await user.tab();
    expect(menu).toBeInTheDocument();
    expect(menu.contains(document.activeElement)).toBe(true);
  });

  it('renders a header, the danger tone and the separators', async () => {
    const user = userEvent.setup();
    render(<Subject header={<span>Anton Georgiev</span>} />);
    await user.click(screen.getByRole('button', TRIGGER));
    await screen.findByRole('menu');
    expect(screen.getByText('Anton Georgiev')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Remove from session' })).toHaveClass('text-danger-text');
    expect(screen.getAllByRole('separator')).toHaveLength(2);
  });

  it('always renders as a panel, even when its trigger sits on the stage, and merges a className', () => {
    render(
      <Surface kind="stage">
        <Subject defaultOpen className="min-w-80" />
      </Surface>,
    );
    const card = screen.getByRole('menu').parentElement;
    expect(card).not.toHaveAttribute('data-surface');
    expect(card?.closest('[data-surface="stage"]')).toBeNull();
    expect(card).toHaveClass('min-w-80', 'bg-surface');
    expect(card).not.toHaveClass('min-w-64');
  });

  it('forwards its ref to the menu element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Subject defaultOpen ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('menu'));
  });
});
