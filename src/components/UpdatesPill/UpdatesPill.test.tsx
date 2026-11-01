import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatUpdates, UpdatesPill } from './UpdatesPill';

describe('UpdatesPill', () => {
  it('is a button named by its visible count, described by what it opens, with decorative discs', () => {
    render(<UpdatesPill kinds={['hands', 'question', 'insight']} description="Opens the updates sheet" />);
    const pill = screen.getByRole('button', { name: '3 updates' });
    expect(pill).toHaveAccessibleDescription('Opens the updates sheet');
    expect(pill.querySelectorAll('[aria-hidden="true"] > span')).toHaveLength(3);
  });

  it('counts every alert but draws at most three discs, and says "1 update" for one', () => {
    const { rerender } = render(<UpdatesPill kinds={['help', 'hands', 'question', 'insight', 'back']} />);
    const pill = screen.getByRole('button', { name: '5 updates' });
    expect(pill.querySelectorAll('[aria-hidden="true"] > span')).toHaveLength(3);
    rerender(<UpdatesPill kinds={['question']} />);
    expect(screen.getByRole('button', { name: '1 update' })).toBeInTheDocument();
    expect(formatUpdates(0)).toBe('0 updates');
  });

  it('renders nothing without alerts', () => {
    render(<UpdatesPill kinds={[]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('presses with the pointer, Enter and Space, and forwards the ref', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<UpdatesPill ref={ref} kinds={['hands']} onPress={onPress} />);
    const pill = screen.getByRole('button', { name: '1 update' });
    expect(ref.current).toBe(pill);
    await user.click(pill);
    await user.tab({ shift: true });
    await user.tab();
    expect(pill).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.keyboard('{Escape}');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('merges a consumer className through tv', () => {
    render(<UpdatesPill kinds={['hands']} className="h-control-sm" />);
    const pill = screen.getByRole('button', { name: '1 update' });
    expect(pill).toHaveClass('h-control-sm');
    expect(pill).not.toHaveClass('h-control-touch');
  });
});
