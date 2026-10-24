import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleButton } from './ToggleButton';

function Microphone(props: Partial<React.ComponentProps<typeof ToggleButton>>) {
  return <ToggleButton label="Microphone" icon="microphoneOff" selectedIcon="microphone" {...props} />;
}

describe('ToggleButton', () => {
  it('keeps the name "Microphone" while aria-pressed flips on click and on Space (X7)', async () => {
    const user = userEvent.setup();
    render(<Microphone />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAccessibleName('Microphone');
    expect(toggle.textContent).toBe('');

    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAccessibleName('Microphone');
  });

  it('marks the selected state with the inset ring cue, not color alone', async () => {
    const user = userEvent.setup();
    render(<Microphone />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveClass('data-selected:selected-ring');
    expect(toggle).not.toHaveAttribute('data-selected');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('data-selected');
  });

  it('swaps the icon with the state', async () => {
    const user = userEvent.setup();
    render(<Microphone />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle.querySelector('svg')).toHaveAttribute('data-icon', 'microphoneOff');
    await user.click(toggle);
    expect(toggle.querySelector('svg')).toHaveAttribute('data-icon', 'microphone');
  });

  it('keeps the same icon when no selectedIcon is given', async () => {
    const user = userEvent.setup();
    render(<ToggleButton label="Raise hand" icon="raiseHand" selectedTone="hand" />);
    const toggle = screen.getByRole('button', { name: 'Raise hand' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle.querySelector('svg')).toHaveAttribute('data-icon', 'raiseHand');
  });

  it('toggles with Tab then Enter and reports through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Microphone onChange={onChange} />);
    await user.tab();
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('closes its tooltip on Escape and keeps focus', async () => {
    const user = userEvent.setup();
    render(<Microphone shortcut="microphone" />);
    await user.tab();
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('stays focusable when disabled, keeps its tooltip, and does not toggle', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Microphone isDisabled defaultSelected onChange={onChange} />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).not.toBeDisabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-selected');
    await user.tab();
    expect(toggle).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    await user.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('follows a controlled isSelected', () => {
    const { rerender } = render(<Microphone isSelected={false} />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    rerender(<Microphone isSelected />);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-selected');
  });

  it('exposes the shortcut and shows it as the tooltip description', async () => {
    const user = userEvent.setup();
    render(<Microphone shortcut="microphone" />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveAttribute('aria-keyshortcuts', 'Alt+M');
    await user.tab();
    await screen.findByRole('tooltip');
    expect(toggle).toHaveAccessibleDescription('Alt + M');
  });

  it('shows speaking with the ring, the speaking glyph and a description', () => {
    const { rerender } = render(<Microphone isSelected />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).not.toHaveClass('ring-speaking');
    expect(toggle).not.toHaveAccessibleDescription();
    rerender(<Microphone isSelected isSpeaking />);
    expect(toggle).toHaveClass('ring-speaking');
    expect(toggle.querySelector('svg')).toHaveAttribute('data-icon', 'speaking');
    expect(toggle).toHaveAccessibleDescription('Speaking');
    expect(toggle).toHaveAccessibleName('Microphone');
    expect(document.querySelector('[aria-live]')).toBeNull();
  });

  it('forwards its ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Microphone ref={ref} shortcut="microphone" />);
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Microphone' }));
    expect(ref.current).toHaveAttribute('aria-keyshortcuts', 'Alt+M');
  });

  it('is a 44px soft square by default, with the hand tone for Raise hand', () => {
    render(<ToggleButton label="Raise hand" icon="raiseHand" selectedTone="hand" />);
    const toggle = screen.getByRole('button', { name: 'Raise hand' });
    expect(toggle).toHaveClass(
      'h-control-touch',
      'w-control-touch',
      'rounded-control',
      'bg-surface-raised',
      'data-selected:bg-status-hand',
      'data-selected:text-on-status-hand',
      'data-selected:selected-ring',
      'data-selected:selected-ring-hand',
    );
    expect(toggle).not.toHaveClass('bg-danger-soft', 'text-danger-text');
  });

  it('keeps the accent ring color for the accent tone', () => {
    render(<Microphone />);
    expect(screen.getByRole('button', { name: 'Microphone' })).not.toHaveClass(
      'data-selected:selected-ring-hand',
    );
  });

  it("keeps a caller's aria-describedby, and adds Speaking to it while speaking", () => {
    const { rerender } = render(
      <>
        <span id="hint">Hint</span>
        <Microphone aria-describedby="hint" />
      </>,
    );
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveAttribute('aria-describedby', 'hint');

    rerender(
      <>
        <span id="hint">Hint</span>
        <Microphone aria-describedby="hint" isSpeaking />
      </>,
    );
    const ids = toggle.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids).toContain('hint');
    expect(ids).toHaveLength(2);
    expect(toggle).toHaveAccessibleDescription('Hint Speaking');
  });

  it('shows a count badge that describes the button, with the name unchanged', () => {
    render(<ToggleButton label="Chat" icon="chat" badge={{ count: 2, label: '2 unread' }} />);
    const toggle = screen.getByRole('button', { name: 'Chat' });
    expect(toggle).toHaveAccessibleDescription('2 unread');
    const badge = screen.getByRole('img', { name: '2 unread' });
    expect(toggle).toContainElement(badge);
    expect(badge).toHaveTextContent('2');
    expect(badge).toHaveClass('absolute', 'border-ring-offset');
  });

  it('joins the badge with Speaking and a caller description, enabled or disabled', () => {
    const { rerender } = render(
      <>
        <span id="hint">Hint</span>
        <Microphone aria-describedby="hint" isSpeaking badge={{ count: 3, label: '3 raised hands' }} />
      </>,
    );
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveAccessibleDescription('Hint 3 raised hands Speaking');
    rerender(
      <>
        <span id="hint">Hint</span>
        <Microphone aria-describedby="hint" isDisabled badge={{ count: 3, label: '3 raised hands' }} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Microphone' })).toHaveAccessibleDescription(
      'Hint 3 raised hands',
    );
  });

  it('keeps DOM props such as id and aria-controls when disabled', () => {
    render(<Microphone isDisabled id="mic" aria-controls="audio-menu" data-slot="mic" />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveAttribute('id', 'mic');
    expect(toggle).toHaveAttribute('aria-controls', 'audio-menu');
    expect(toggle).toHaveAttribute('data-slot', 'mic');
    expect(toggle).toHaveClass('forced-colors-disabled');
  });
});
