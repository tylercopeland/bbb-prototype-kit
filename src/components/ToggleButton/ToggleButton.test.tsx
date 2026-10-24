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
    render(<ToggleButton label="Raise hand" icon="raiseHand" tone="hand" />);
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

  it('is blocked by isDisabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Microphone isDisabled onChange={onChange} />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toBeDisabled();
    await user.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('follows a controlled isSelected', () => {
    const { rerender } = render(<Microphone isSelected={false} />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    rerender(<Microphone isSelected />);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-selected');
  });

  it('exposes the shortcut and shows it in the tooltip', async () => {
    const user = userEvent.setup();
    render(<Microphone shortcut="microphone" />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).toHaveAttribute('aria-keyshortcuts', 'Alt+M');
    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('MicrophoneAlt + M');
  });

  it('adds the speaking ring only with isSpeaking', () => {
    const { rerender } = render(<Microphone isSelected />);
    const toggle = screen.getByRole('button', { name: 'Microphone' });
    expect(toggle).not.toHaveClass('ring-speaking');
    rerender(<Microphone isSelected isSpeaking />);
    expect(toggle).toHaveClass('ring-speaking');
  });

  it('is a 44px soft square by default, with the hand tone for Raise hand', () => {
    render(<ToggleButton label="Raise hand" icon="raiseHand" tone="hand" />);
    const toggle = screen.getByRole('button', { name: 'Raise hand' });
    expect(toggle).toHaveClass(
      'h-control-touch',
      'w-control-touch',
      'rounded-control',
      'bg-surface-raised',
      'data-selected:bg-status-hand',
      'data-selected:text-on-status-hand',
    );
  });
});
