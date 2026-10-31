import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoom, defaultPlugins, selectPluginSubtitles } from '../../mocks';
import { PluginsMenu } from './PluginsMenu';

const subtitles = selectPluginSubtitles(createRoom());

function Subject(props: Partial<React.ComponentProps<typeof PluginsMenu>>) {
  return (
    <PluginsMenu
      featured={defaultPlugins.featured}
      more={defaultPlugins.more}
      subtitles={subtitles}
      {...props}
    />
  );
}

describe('PluginsMenu', () => {
  it('lists the featured cards with their state and the more plugins with their descriptions', () => {
    render(<Subject />);
    const featured = screen.getByRole('group', { name: 'Featured plugins' });
    const cards = within(featured).getAllByRole('button');
    expect(cards.map((c) => c.textContent)).toEqual([
      'Breakout rooms4 rooms set up',
      'PollNot started',
      'TimerNot running',
    ]);
    expect(within(featured).getByRole('button', { name: 'Breakout rooms' })).toHaveAccessibleDescription(
      '4 rooms set up',
    );
    const more = screen.getByRole('group', { name: 'More plugins' });
    expect(
      within(more)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-describedby') !== null),
    ).toEqual([true, true, true, true]);
    expect(within(more).getByRole('button', { name: 'Q&A board' })).toHaveAccessibleDescription(
      'Collect and upvote questions',
    );
  });

  it('reports the picked plugin by id, from a click and from the keyboard', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<Subject onPick={onPick} />);
    await user.click(screen.getByRole('button', { name: 'Breakout rooms' }));
    expect(onPick).toHaveBeenLastCalledWith('breakouts');
    screen.getByRole('button', { name: 'Breakout rooms' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Poll' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPick).toHaveBeenLastCalledWith('poll');
    await user.tab();
    await user.keyboard(' ');
    expect(onPick).toHaveBeenLastCalledWith('timer');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onPick).toHaveBeenLastCalledWith('qa');
  });

  it('handles no featured cards and no more plugins', () => {
    const { rerender } = render(<Subject more={[]} />);
    expect(screen.queryByRole('group', { name: 'More plugins' })).not.toBeInTheDocument();
    expect(screen.getByText('No other plugins are installed.')).toBeInTheDocument();
    rerender(<Subject featured={[]} />);
    expect(screen.queryByRole('group', { name: 'Featured plugins' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'More plugins' })).toBeInTheDocument();
  });

  it('falls back to the plugin description and glyph for an unknown plugin, and merges a className', () => {
    const { container } = render(
      <Subject
        className="gap-4"
        featured={[{ id: 'unknown', label: 'Mystery', description: 'Does something' }]}
        subtitles={{}}
      />,
    );
    expect(container.firstElementChild).toHaveClass('gap-4');
    const card = screen.getByRole('button', { name: 'Mystery' });
    expect(card).toHaveAccessibleDescription('Does something');
    expect(card.querySelector('[data-icon="plugins"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Quiz' }).querySelector('[data-icon="quiz"]')).not.toBeNull();
  });
});
