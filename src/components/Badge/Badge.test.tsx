import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, formatCount } from './Badge';

describe('Badge', () => {
  it('is an image named by its label, showing the count', () => {
    render(<Badge count={3} label="3 unread" />);
    const badge = screen.getByRole('img', { name: '3 unread' });
    expect(badge).toHaveTextContent('3');
  });

  it('shows "99+" above 99 and keeps the exact count in the label', () => {
    render(<Badge count={240} label="240 unread" />);
    const badge = screen.getByRole('img', { name: '240 unread' });
    expect(badge).toHaveTextContent('99+');
    expect(formatCount(99)).toBe('99');
    expect(formatCount(100)).toBe('99+');
    expect(formatCount(0)).toBe('0');
    expect(formatCount(-2)).toBe('0');
  });

  it('is neutral by default and red only with tone="urgent"', () => {
    const { rerender } = render(<Badge count={2} label="2 unread" />);
    const badge = screen.getByRole('img');
    expect(badge).toHaveClass('bg-text', 'text-surface');
    expect(badge).not.toHaveClass('bg-danger');
    rerender(<Badge count={2} label="2 help requests" tone="urgent" />);
    expect(badge).toHaveClass('bg-danger', 'text-on-danger');
  });

  it('swaps to surface on text when inverted, for a selected chip', () => {
    render(<Badge count={14} label="14 people" inverted />);
    expect(screen.getByRole('img')).toHaveClass('bg-surface', 'text-text');
  });

  it('is not focusable', async () => {
    const user = userEvent.setup();
    render(<Badge count={3} label="3 unread" />);
    await user.tab();
    expect(screen.getByRole('img')).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });

  it('merges a consumer className over its own scale', () => {
    render(<Badge count={3} label="3 unread" className="absolute -top-1 -right-1 h-6" />);
    const badge = screen.getByRole('img');
    expect(badge).toHaveClass('absolute', '-top-1', '-right-1', 'h-6');
    expect(badge).not.toHaveClass('h-5');
  });
});
