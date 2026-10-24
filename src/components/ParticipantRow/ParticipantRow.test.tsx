import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoom, FIXTURE_NOW, type Participant, type ParticipantFixture } from '../../mocks';
import { ParticipantRow, participantStatus } from './ParticipantRow';

const by = (id: string, people: ParticipantFixture = 'class'): Participant =>
  createRoom({ participants: people }).participants.find((p) => p.id === id)!;

function Subject(props: Partial<React.ComponentProps<typeof ParticipantRow>> & { id?: string }) {
  const { id = 'anton', ...rest } = props;
  return (
    <ul>
      <ParticipantRow participant={by(id)} now={FIXTURE_NOW} {...rest} />
    </ul>
  );
}

describe('ParticipantRow', () => {
  it('shows the name, the status image (Option A) and the two row actions', () => {
    render(<Subject />);
    expect(screen.getByText('Anton Georgiev')).toHaveClass('truncate');
    expect(screen.getByRole('img', { name: 'Muted, camera on' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Message Anton Georgiev privately' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions for Anton Georgiev' })).toHaveAttribute('aria-haspopup', 'true');
    const actions = screen.getByRole('button', { name: 'Message Anton Georgiev privately' }).parentElement;
    expect(actions).toHaveClass('opacity-0', 'group-focus-within:opacity-100', 'pointer-coarse:opacity-100');
  });

  it('draws speaking with the green disc and ring, hands and presenting on the second line', () => {
    const { rerender } = render(<Subject id="frederick" />);
    expect(screen.getByRole('img', { name: 'Speaking, camera on' }).firstElementChild).toHaveClass('bg-status-live');
    expect(document.querySelector('.ring-speaking')).not.toBeNull();
    expect(document.querySelector('[data-icon="speaking"]')).not.toBeNull();
    rerender(<Subject id="bruno" />);
    expect(screen.getByText('Raised · 3 min')).toHaveClass('text-status-hand-text');
    expect(document.querySelector('[data-icon="raiseHand"]')).not.toBeNull();
    rerender(<Subject id="helena" />);
    expect(screen.getByText('Presenting')).toHaveClass('text-accent');
    expect(screen.getByText('(you)')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<Subject id="ellen" />);
    expect(screen.getByRole('img', { name: 'Listening only, camera off' })).toBeInTheDocument();
    expect(document.querySelector('[data-icon="listenOnly"]')).not.toBeNull();
    rerender(<Subject id="timo" showEngagement />);
    expect(screen.getByText('Camera off · quiet for 22 min')).toHaveClass('text-text-muted');
  });

  it('calls onMessage from the Message privately button', async () => {
    const user = userEvent.setup();
    const onMessage = vi.fn();
    render(<Subject onMessage={onMessage} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Message Anton Georgiev privately' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it('opens the ⋯ menu with Enter, reports the open state, and Escape returns focus', async () => {
    const user = userEvent.setup();
    const onMenuOpenChange = vi.fn();
    const onAction = vi.fn();
    render(<Subject onMenuOpenChange={onMenuOpenChange} onAction={onAction} />);
    const more = screen.getByRole('button', { name: 'More actions for Anton Georgiev' });
    more.focus();
    await user.keyboard('{Enter}');
    expect(onMenuOpenChange).toHaveBeenCalledWith(true);
    const menu = await screen.findByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem').map((m) => m.textContent)).toEqual([
      'Make presenter',
      'Turn off camera',
      'Remove from session',
    ]);
    // The switch keeps its label (X7, X9): unchecked for a muted person, checked only while the mic is on.
    expect(screen.getByRole('menuitemcheckbox', { name: 'Microphone' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Muted, camera on')).toBeInTheDocument();
    expect(screen.getByText('Anton Georgiev', { selector: '.break-words' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onMenuOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(more).toHaveFocus());
  });

  it('maps the menu items and switches to actions', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Subject onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'More actions for Anton Georgiev' }));
    await screen.findByRole('menu');
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Whiteboard access' }));
    expect(onAction).toHaveBeenLastCalledWith({ type: 'flag', flag: 'hasWhiteboard', value: true });
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Microphone' }));
    expect(onAction).toHaveBeenLastCalledWith({ type: 'microphone', on: true });
    await user.click(screen.getByRole('menuitem', { name: 'Turn off camera' }));
    expect(onAction).toHaveBeenLastCalledWith({ type: 'setCamera', on: false });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('keeps the Microphone switch unchecked while a request is pending, and checked for a live mic', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { rerender } = render(<Subject participant={{ ...by('anton'), unmuteRequested: true }} onAction={onAction} />);
    // The pending request shows in the row's second line, never in the switch's label.
    expect(screen.getByText('Asked to unmute')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More actions for Anton Georgiev' }));
    await screen.findByRole('menu');
    const mic = screen.getByRole('menuitemcheckbox', { name: 'Microphone' });
    expect(mic).toHaveAttribute('aria-checked', 'false');
    expect(mic).not.toHaveAccessibleDescription();
    await user.click(mic);
    expect(onAction).toHaveBeenLastCalledWith({ type: 'microphone', on: true });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    rerender(<Subject id="frederick" onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'More actions for Frederick Dixon' }));
    await screen.findByRole('menu');
    const live = screen.getByRole('menuitemcheckbox', { name: 'Microphone' });
    expect(live).toHaveAttribute('aria-checked', 'true');
    await user.click(live);
    expect(onAction).toHaveBeenLastCalledWith({ type: 'microphone', on: false });
  });

  it('disables the microphone switch before audio is joined, and Make presenter for the presenter', async () => {
    const user = userEvent.setup();
    render(<Subject id="timo" />);
    await user.click(screen.getByRole('button', { name: 'More actions for Timo' }));
    await screen.findByRole('menu');
    const mic = screen.getByRole('menuitemcheckbox', { name: 'Microphone' });
    expect(mic).toHaveAttribute('aria-disabled', 'true');
    expect(mic).toHaveAccessibleDescription('Audio not joined');
    expect(screen.getByRole('menuitem', { name: 'Turn on camera' })).toBeInTheDocument();
  });

  it('confirms Remove from session in an alert dialog before acting', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Subject onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'More actions for Anton Georgiev' }));
    await screen.findByRole('menu');
    await user.click(screen.getByRole('menuitem', { name: 'Remove from session' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Remove Anton Georgiev?' });
    expect(dialog).toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'More actions for Anton Georgiev' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from session' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'remove' });
  });

  it('shows a cut-off name in full in a tooltip on hover and on focus inside the row, and nothing when it fits', async () => {
    const user = userEvent.setup();
    render(<Subject id="michelle" />);
    const name = screen.getByText('Michelle Winkler');
    await user.pointer({ target: document.body, coords: { x: 0, y: 0 } });
    await user.hover(name);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.unhover(name);
    Object.defineProperty(name, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(name, 'clientWidth', { value: 150, configurable: true });
    await user.hover(name);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Michelle Winkler');
    await user.unhover(name);
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    // The name is not focusable: Tab goes straight to the first action, and the name tooltip shows while the
    // row holds focus (next to the focused button's own tooltip).
    await user.tab();
    expect(screen.getByRole('button', { name: 'Message Michelle Winkler privately' })).toHaveFocus();
    await waitFor(() => expect(screen.getAllByRole('tooltip').map((t) => t.textContent)).toContain('Michelle Winkler'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Message Michelle Winkler privately' })).toHaveFocus();
  });

  it('describes every state in words and merges a className', () => {
    expect(participantStatus({ audio: 'notJoined', camera: false })).toBe('Audio not joined, camera off');
    render(<Subject className="px-4" />);
    expect(screen.getByRole('listitem')).toHaveClass('px-4');
    expect(screen.getByRole('listitem')).not.toHaveClass('px-2');
  });
});
