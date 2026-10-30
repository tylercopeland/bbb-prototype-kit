import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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

  it('shows no badge at zero, and says "1 raised hand" for one', () => {
    const { rerender } = render(<Subject raisedHands={0} unread={0} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    rerender(<Subject raisedHands={1} unread={1} />);
    expect(button('People')).toHaveAccessibleDescription('1 raised hand');
    expect(button('Chat')).toHaveAccessibleDescription('1 unread');
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
    const { rerender } = render(
      <Subject onMicrophoneChange={onMicrophoneChange} onJoinAudio={onJoinAudio} />,
    );
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

  it('anchors the Plugins and Share media pickers to their toggles, with aria-expanded and aria-controls', async () => {
    const user = userEvent.setup();
    const onPluginsOpenChange = vi.fn();
    const onMediaOpenChange = vi.fn();
    const { rerender } = render(
      <Subject
        pluginsPicker={<p>Plugins content</p>}
        mediaPicker={<p>Media content</p>}
        onPluginsOpenChange={onPluginsOpenChange}
        onMediaOpenChange={onMediaOpenChange}
      />,
    );
    const plugins = button('Plugins');
    expect(plugins).toHaveAttribute('aria-haspopup', 'dialog');
    expect(plugins).toHaveAttribute('aria-expanded', 'false');
    expect(plugins).not.toHaveAttribute('aria-controls');
    await user.click(plugins);
    expect(onPluginsOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <Subject
        pluginsOpen
        pluginsPicker={<p>Plugins content</p>}
        onPluginsOpenChange={onPluginsOpenChange}
      />,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Plugins' });
    expect(dialog).toHaveTextContent('Plugins content');
    const pressed = screen.getByRole('button', { name: 'Plugins', hidden: true });
    expect(pressed).toHaveAttribute('aria-pressed', 'true');
    expect(pressed).toHaveAttribute('aria-expanded', 'true');
    expect(pressed).toHaveAttribute('aria-controls', dialog.id);
    await user.keyboard('{Escape}');
    expect(onPluginsOpenChange).toHaveBeenLastCalledWith(false);

    rerender(<Subject mediaOpen mediaPicker={<p>Media content</p>} onMediaOpenChange={onMediaOpenChange} />);
    const media = await screen.findByRole('dialog', { name: 'Share media' });
    expect(media).toHaveTextContent('Media content');
    expect(screen.getByRole('button', { name: 'Share media', hidden: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onMediaOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('Share media is pressed while sharing, and asks to open the picker rather than to stop', async () => {
    const user = userEvent.setup();
    const onMediaOpenChange = vi.fn();
    render(<Subject isSharing mediaPicker={<p>Media content</p>} onMediaOpenChange={onMediaOpenChange} />);
    const share = button('Share media');
    expect(share).toHaveAttribute('aria-pressed', 'true');
    await user.click(share);
    expect(onMediaOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('React opens the tray, a reaction is reported and the tray closes with focus back on React', async () => {
    const user = userEvent.setup();
    const onReaction = vi.fn();
    render(<Subject onReaction={onReaction} />);
    const react = button('React');
    react.focus();
    await user.keyboard('{Enter}');
    const tray = await screen.findByRole('dialog', { name: 'React' });
    expect(react).toHaveAttribute('aria-expanded', 'true');
    await user.click(within(tray).getByRole('button', { name: 'Celebrate' }));
    expect(onReaction).toHaveBeenCalledWith('celebrate');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(react).toHaveFocus());
  });

  it('Room settings opens its popover when content is given, and Learning Analytics says it opens in a new tab', async () => {
    const user = userEvent.setup();
    const onAnalytics = vi.fn();
    const { unmount } = render(<Subject onAnalytics={onAnalytics} />);
    const analytics = button('Learning Analytics Dashboard');
    expect(analytics).toHaveAccessibleDescription('Opens in a new tab');
    await user.click(analytics);
    expect(onAnalytics).toHaveBeenCalledTimes(1);
    await user.click(button('Room settings'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    // The pinned tooltip (O1) opens on mount.
    render(<Subject settings={<p>Private chat switch</p>} analyticsTipOpen />);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Learning Analytics Dashboard');
    await user.click(button('Room settings'));
    expect(await screen.findByRole('dialog', { name: 'Room settings' })).toHaveTextContent(
      'Private chat switch',
    );
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
