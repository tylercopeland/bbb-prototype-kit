import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('is found by role and its label, with no visible text', () => {
    render(<IconButton label="Close" icon="close" />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveAttribute('aria-label', 'Close');
    expect(button.textContent).toBe('');
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('data-icon', 'close');
  });

  it('shows its tooltip on Tab', async () => {
    const user = userEvent.setup();
    render(<IconButton label="Mute everyone" icon="microphoneOff" />);
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Mute everyone');
    expect(screen.getByRole('button', { name: 'Mute everyone' })).toHaveAttribute(
      'aria-describedby',
      tooltip.id,
    );
  });

  it('exposes the shortcut as aria-keyshortcuts and in the tooltip', async () => {
    const user = userEvent.setup();
    render(<IconButton label="Raise hand" icon="raiseHand" shortcut="raiseHand" />);
    const button = screen.getByRole('button', { name: 'Raise hand' });
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Alt+H');
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.querySelector('kbd')).toHaveTextContent('Alt + H');
  });

  it('has no aria-keyshortcuts without a shortcut', () => {
    render(<IconButton label="Close" icon="close" />);
    expect(screen.getByRole('button', { name: 'Close' })).not.toHaveAttribute('aria-keyshortcuts');
  });

  it('fires onPress on Enter and Space', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<IconButton label="Close" icon="close" onPress={onPress} />);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('is disabled with isDisabled', () => {
    render(<IconButton label="Close" icon="close" isDisabled />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
  });

  it('draws Leave as the soft danger touch square', () => {
    render(<IconButton label="Leave session" icon="leave" variant="soft" tone="danger" size="touch" />);
    const button = screen.getByRole('button', { name: 'Leave session' });
    expect(button).toHaveClass(
      'bg-danger-soft',
      'text-danger-text',
      'h-control-touch',
      'w-control-touch',
      'rounded-control',
      'hit-area',
    );
    expect(button).not.toHaveClass('px-5');
  });

  it('uses the icon color for the ghost variant', () => {
    render(<IconButton label="Close" icon="close" />);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('text-icon');
    expect(screen.getByRole('button', { name: 'Close' })).not.toHaveClass('text-accent');
  });
});
