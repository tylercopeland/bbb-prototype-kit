import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactionTray } from './ReactionTray';

describe('ReactionTray', () => {
  it('is a group of six buttons named by their reaction, with the emoji hidden', () => {
    render(<ReactionTray />);
    const group = screen.getByRole('group', { name: 'Reactions' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Thumbs up',
      'Clap',
      'Laugh',
      'Surprised',
      'Love',
      'Celebrate',
    ]);
    expect(buttons[0].firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(buttons[0]).toHaveTextContent('👍');
  });

  it('reports the reaction from a click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onReact = vi.fn();
    render(<ReactionTray onReact={onReact} />);
    await user.click(screen.getByRole('button', { name: 'Clap' }));
    expect(onReact).toHaveBeenLastCalledWith('clap');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Laugh' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onReact).toHaveBeenLastCalledWith('laugh');
    await user.tab();
    await user.keyboard(' ');
    expect(onReact).toHaveBeenLastCalledWith('surprised');
  });

  it('shows the name in a tooltip on focus and closes it on Escape', async () => {
    const user = userEvent.setup();
    render(<ReactionTray />);
    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Thumbs up');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thumbs up' })).toHaveFocus();
  });

  it('merges a className', () => {
    render(<ReactionTray className="justify-between" />);
    expect(screen.getByRole('group', { name: 'Reactions' })).toHaveClass('justify-between', 'flex');
  });
});
