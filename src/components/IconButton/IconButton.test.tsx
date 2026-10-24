import { createRef } from 'react';
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

  it('shows its tooltip on Tab without repeating its name in the description', async () => {
    const user = userEvent.setup();
    render(<IconButton label="Settings" icon="settings" />);
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Settings');
    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(button).toHaveAccessibleDescription('');
  });

  it('closes the tooltip on Escape and keeps focus', async () => {
    const user = userEvent.setup();
    render(<IconButton label="Settings" icon="settings" />);
    await user.tab();
    const button = screen.getByRole('button', { name: 'Settings' });
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('exposes the shortcut as aria-keyshortcuts and as the tooltip description', async () => {
    const user = userEvent.setup();
    render(<IconButton label="Join audio" icon="audioNotJoined" shortcut="microphone" />);
    const button = screen.getByRole('button', { name: 'Join audio' });
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Alt+M');
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.querySelector('kbd')).toHaveTextContent('Alt + M');
    expect(button).toHaveAccessibleDescription('Alt + M');
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

  it('stays focusable when disabled, keeps its tooltip, and does nothing on press', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<IconButton label="Close" icon="close" isDisabled onPress={onPress} shortcut="microphone" />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Alt+M');
    expect(button).toHaveClass('text-text-muted');
    await user.tab();
    expect(button).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Close');
    await user.keyboard('{Enter}');
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('forwards its ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton ref={ref} label="Close" icon="close" shortcut="camera" />);
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Close' }));
    expect(ref.current).toHaveAttribute('aria-keyshortcuts', 'Alt+V');
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

  it('keeps DOM props and its ref when disabled, and greys out in forced colors', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton
        label="More"
        icon="more"
        isDisabled
        ref={ref}
        id="more"
        aria-controls="row-menu"
        aria-expanded={false}
      />,
    );
    const button = screen.getByRole('button', { name: 'More' });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute('id', 'more');
    expect(button).toHaveAttribute('aria-controls', 'row-menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveClass('forced-colors-disabled');
  });
});
