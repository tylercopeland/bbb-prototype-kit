import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('is a button named by its text', () => {
    render(<Button>Start sharing</Button>);
    expect(screen.getByRole('button', { name: 'Start sharing' })).toBeInTheDocument();
  });

  it('fires onPress on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Join</Button>);
    const button = screen.getByRole('button', { name: 'Join' });
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    button.focus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(2);
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('is disabled and inert with isDisabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Button isDisabled onPress={onPress}>
        Join
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Join' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is reached by Tab and shows the keyboard focus ring', async () => {
    const user = userEvent.setup();
    render(<Button>Join</Button>);
    const button = screen.getByRole('button', { name: 'Join' });
    await user.tab();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('data-focus-visible');
    expect(button).toHaveClass('focus-ring');
  });

  it('renders its icons as decoration', () => {
    render(
      <Button icon="shareMedia" iconEnd="externalLink">
        Start sharing
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Start sharing' });
    const icons = button.querySelectorAll('svg');
    expect(icons).toHaveLength(2);
    expect(icons[0]).toHaveAttribute('data-icon', 'shareMedia');
    expect(icons[1]).toHaveAttribute('data-icon', 'externalLink');
    for (const icon of icons) expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges a consumer className with the variant classes', () => {
    render(
      <Button variant="primary" tone="danger" className="w-full">
        Stop sharing
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Stop sharing' });
    expect(button).toHaveClass('w-full', 'bg-danger', 'text-on-danger', 'h-control-md');
  });
});
