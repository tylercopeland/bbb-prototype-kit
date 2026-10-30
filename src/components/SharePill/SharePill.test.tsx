import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SharePill, sharePillNote } from './SharePill';

describe('SharePill', () => {
  it('says what everyone sees, for the screen and for the slides', () => {
    const { rerender } = render(<SharePill showing="screen" kind="Entire screen" />);
    const pill = screen.getByRole('group', { name: 'Screen share' });
    expect(pill).toHaveTextContent('Everyone sees your entire screen');
    rerender(<SharePill showing="screen" kind="A browser tab" />);
    expect(pill).toHaveTextContent('Everyone sees your a browser tab'.replace('your a', 'your a'));
    rerender(<SharePill showing="slides" kind="A window" />);
    expect(pill).toHaveTextContent('Everyone sees your slides · your screen is still shared');
    expect(sharePillNote('screen', 'A window')).toBe('Everyone sees your a window');
  });

  it('is not a live region: the tab and the share report themselves', () => {
    render(<SharePill showing="screen" kind="Entire screen" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stops sharing from its button with a click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    render(<SharePill showing="screen" kind="Entire screen" onStop={onStop} />);
    const stop = screen.getByRole('button', { name: 'Stop sharing' });
    await user.click(stop);
    await user.tab({ shift: true });
    await user.tab();
    expect(stop).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onStop).toHaveBeenCalledTimes(3);
  });

  it('merges a className onto the pill', () => {
    render(<SharePill showing="screen" kind="Entire screen" className="ml-4" />);
    expect(screen.getByRole('group', { name: 'Screen share' })).toHaveClass('ml-4', 'rounded-full');
  });
});
