import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionBar } from './ActionBar';

function Subject(props: Partial<React.ComponentProps<typeof ActionBar>>) {
  return (
    <ActionBar
      panel="none"
      raisedHands={4}
      unread={2}
      audio="live"
      camera
      handRaised={false}
      onTogglePanel={() => {}}
      {...props}
    />
  );
}

const button = (name: string) => screen.getByRole('button', { name });

describe('ActionBar', () => {
  it('is a nav named Actions with the three groups in order', () => {
    render(<Subject />);
    const nav = screen.getByRole('navigation', { name: 'Actions' });
    const names = Array.from(nav.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual([
      'People',
      'Chat',
      'Shared notes',
      'Plugins',
      'Microphone',
      'Camera',
      'Share media',
      'React',
      'Raise hand',
      'Learning Analytics Dashboard',
      'Room settings',
      'Leave session',
    ]);
  });

  it('presses the open panel and shows the counts as descriptions, hidden on the open panel', () => {
    const { rerender } = render(<Subject />);
    expect(button('People')).toHaveAttribute('aria-pressed', 'false');
    expect(button('People')).toHaveAccessibleDescription('4 raised hands');
    expect(button('Chat')).toHaveAccessibleDescription('2 unread');
    rerender(<Subject panel="people" />);
    expect(button('People')).toHaveAttribute('aria-pressed', 'true');
    expect(button('People')).not.toHaveAccessibleDescription();
    expect(button('Chat')).toHaveAccessibleDescription('2 unread');
  });

  it('shows no badge at zero', () => {
    render(<Subject raisedHands={0} unread={0} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('reports panel toggles, with a fixed label', async () => {
    const user = userEvent.setup();
    const onTogglePanel = vi.fn();
    render(<Subject onTogglePanel={onTogglePanel} />);
    await user.click(button('Chat'));
    expect(onTogglePanel).toHaveBeenCalledWith('chat');
    await user.click(button('Shared notes'));
    expect(onTogglePanel).toHaveBeenCalledWith('notes');
    expect(button('Chat')).toHaveAccessibleName('Chat');
  });

  it('shows the mic as a toggle once audio is joined, and Join audio before', async () => {
    const user = userEvent.setup();
    const onMicrophoneChange = vi.fn();
    const onJoinAudio = vi.fn();
    const { rerender } = render(<Subject onMicrophoneChange={onMicrophoneChange} onJoinAudio={onJoinAudio} />);
    const mic = button('Microphone');
    expect(mic).toHaveAttribute('aria-pressed', 'true');
    expect(mic).toHaveAttribute('aria-keyshortcuts', 'Alt+M');
    await user.click(mic);
    expect(onMicrophoneChange).toHaveBeenCalledWith(false);

    rerender(<Subject audio="speaking" />);
    expect(button('Microphone')).toHaveAccessibleDescription('Speaking');

    rerender(<Subject audio="notJoined" onJoinAudio={onJoinAudio} />);
    expect(screen.queryByRole('button', { name: 'Microphone' })).not.toBeInTheDocument();
    const join = button('Join audio');
    expect(join).toHaveAttribute('aria-keyshortcuts', 'Alt+M');
    expect(join).not.toHaveAttribute('aria-pressed');
    await user.click(join);
    expect(onJoinAudio).toHaveBeenCalledTimes(1);
    // Joining lands muted (owner decision): the toggle appears unpressed.
    rerender(<Subject audio="muted" />);
    expect(button('Microphone')).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles camera and raise hand through their callbacks, keyboard first', async () => {
    const user = userEvent.setup();
    const onCameraChange = vi.fn();
    const onRaiseHandChange = vi.fn();
    render(<Subject camera={false} onCameraChange={onCameraChange} onRaiseHandChange={onRaiseHandChange} />);
    button('Camera').focus();
    await user.keyboard('{Enter}');
    expect(onCameraChange).toHaveBeenCalledWith(true);
    button('Raise hand').focus();
    await user.keyboard(' ');
    expect(onRaiseHandChange).toHaveBeenCalledWith(true);
    expect(button('Raise hand')).toHaveClass('data-selected:selected-ring-hand');
  });

  it('confirms Leave in an alert dialog: Escape cancels and returns focus, Leave session calls onLeave', async () => {
    const user = userEvent.setup();
    const onLeave = vi.fn();
    render(<Subject onLeave={onLeave} />);
    const leave = button('Leave session');
    leave.focus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('alertdialog', { name: 'Leave the session?' });
    expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onLeave).not.toHaveBeenCalled();
    await waitFor(() => expect(leave).toHaveFocus());

    await user.keyboard('{Enter}');
    await screen.findByRole('alertdialog');
    await user.click(screen.getAllByRole('button', { name: 'Leave session' }).at(-1)!);
    expect(onLeave).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('hands out the panel toggles through panelRefs, so the room can return focus to them', () => {
    const people = createRef<HTMLButtonElement>();
    const chat = createRef<HTMLButtonElement>();
    const notes = createRef<HTMLButtonElement>();
    const plugins = createRef<HTMLButtonElement>();
    render(<Subject panelRefs={{ people, chat, notes, plugins }} />);
    expect(people.current).toBe(button('People'));
    expect(chat.current).toBe(button('Chat'));
    expect(notes.current).toBe(button('Shared notes'));
    expect(plugins.current).toBe(button('Plugins'));
    chat.current?.focus();
    expect(button('Chat')).toHaveFocus();
  });

  it('reaches every control with Tab', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.tab();
    expect(button('People')).toHaveFocus();
    for (let i = 0; i < 11; i++) await user.tab();
    expect(button('Leave session')).toHaveFocus();
  });
});
