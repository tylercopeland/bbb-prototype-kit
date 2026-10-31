import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClosingCountdown } from './ClosingCountdown';

describe('ClosingCountdown', () => {
  it('is a group named Closing rooms with the time as plain text, never a live region (X10)', () => {
    render(<ClosingCountdown leftSec={60} />);
    const group = screen.getByRole('group', { name: 'Closing rooms' });
    expect(within(group).getByText('1:00')).toBeInTheDocument();
    expect(within(group).getByText('Wrapping up')).toBeInTheDocument();
    expect(group.querySelector('[aria-live], [role="status"], [role="timer"], [role="alert"]')).toBeNull();
  });

  it('leaves the kicker and note to the dialog in the dialog variant', () => {
    render(<ClosingCountdown leftSec={42} variant="dialog" />);
    expect(screen.getByText('0:42')).toHaveClass('text-2xl');
    expect(screen.queryByText('Wrapping up')).not.toBeInTheDocument();
  });

  it('keeps the rooms open or brings everyone back with a click, Enter and Space, and forwards the ref', async () => {
    const user = userEvent.setup();
    const onKeepOpen = vi.fn();
    const onBringBack = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<ClosingCountdown leftSec={30} onKeepOpen={onKeepOpen} onBringBack={onBringBack} keepOpenRef={ref} />);
    const keep = screen.getByRole('button', { name: 'Keep rooms open' });
    expect(ref.current).toBe(keep);
    await user.tab();
    expect(keep).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onKeepOpen).toHaveBeenCalledTimes(2);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Bring everyone back now' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onBringBack).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onKeepOpen).toHaveBeenCalledTimes(2);
  });
});
