import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createRoom,
  roomReducer,
  FIXTURE_NOW,
  selectPeople,
  selectPeopleFilterCounts,
  type ParticipantFixture,
  type PeopleFilter,
  type RoomState,
} from '../../mocks';
import { ParticipantList } from './ParticipantList';

/** The list over a live state: Remove from session takes the person out, as the room does. */
function Removable({
  people = 'class',
  filter = 'all',
}: {
  people?: ParticipantFixture;
  filter?: PeopleFilter;
}) {
  const [state, setState] = useState<RoomState>(() => createRoom({ participants: people }));
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { hands, others } = selectPeople(filter)(state);
  return (
    <ParticipantList
      hands={hands}
      others={others}
      counts={selectPeopleFilterCounts(state)}
      filter={filter}
      now={FIXTURE_NOW}
      openMenu={openMenu}
      onMenuOpenChange={(id, open) => setOpenMenu(open ? id : null)}
      onAction={(participantId, action) => {
        if (action.type === 'remove')
          setState((s) => roomReducer(s, { type: 'removeParticipant', participantId }));
      }}
    />
  );
}

async function remove(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: `More actions for ${name}` }));
  await user.click(await screen.findByRole('menuitem', { name: 'Remove from session' }));
  await user.click(await screen.findByRole('button', { name: 'Remove' }));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(screen.queryByText(name)).not.toBeInTheDocument();
}

function Subject({
  people = 'class',
  filter = 'all',
  ...props
}: Partial<React.ComponentProps<typeof ParticipantList>> & {
  people?: ParticipantFixture;
  filter?: PeopleFilter;
}) {
  const state = createRoom({ participants: people });
  const { hands, others } = selectPeople(filter)(state);
  return (
    <ParticipantList
      hands={hands}
      others={others}
      counts={selectPeopleFilterCounts(state)}
      filter={filter}
      now={FIXTURE_NOW}
      {...props}
    />
  );
}

describe('ParticipantList', () => {
  it('has the filter chips with counts and the raised hands section before everyone', () => {
    render(<Subject />);
    const group = screen.getByRole('radiogroup', { name: 'Filter people' });
    expect(within(group).getByRole('radio', { name: 'All 14 people' })).toBeChecked();
    expect(within(group).getByRole('radio', { name: 'Raised hands 4 people' })).toBeInTheDocument();
    expect(within(group).getByRole('radio', { name: 'Low engagement 3 people' })).toBeInTheDocument();
    const hands = screen.getByRole('list', { name: 'Raised hands 4' });
    expect(within(hands).getAllByRole('listitem')).toHaveLength(4);
    expect(within(hands).getAllByRole('listitem')[0]).toHaveTextContent('Bruno');
    const everyone = screen.getByRole('list', { name: 'Everyone 10' });
    expect(within(everyone).getAllByRole('listitem')).toHaveLength(10);
    expect(within(everyone).getAllByRole('listitem')[0]).toHaveTextContent('Prof. Helena Costa(you)');
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Raised hands 4', 'Everyone 10']);
  });

  it('reports the filter with the arrow keys and shows only the hands for Raised hands', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const { rerender } = render(<Subject onFilterChange={onFilterChange} />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onFilterChange).toHaveBeenCalledWith('hands');
    rerender(<Subject filter="hands" />);
    expect(screen.getByRole('list', { name: 'Raised hands 4' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /Everyone/ })).not.toBeInTheDocument();
  });

  it('shows the insight note and the quiet students for Low engagement (L1)', async () => {
    const user = userEvent.setup();
    const onAnalytics = vi.fn();
    render(<Subject filter="low" onAnalytics={onAnalytics} />);
    expect(screen.getByText(/Quiet for 15\+ minutes/)).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Low engagement 3' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Camera off · quiet for 22 min');
    expect(items[1]).toHaveTextContent('No chat or poll answers yet');
    expect(items[2]).toHaveTextContent('Missed the last poll · quiet for 18 min');
    expect(screen.queryByRole('heading', { name: /Raised hands/ })).not.toBeInTheDocument();
    const analytics = screen.getByRole('button', { name: 'See full activity in Learning Analytics' });
    expect(analytics).toHaveAccessibleDescription('Opens in a new tab');
    await user.click(analytics);
    expect(onAnalytics).toHaveBeenCalledTimes(1);
  });

  it('handles one person and the empty filters', () => {
    const { rerender } = render(<Subject people="one" />);
    expect(screen.getByRole('radio', { name: 'All 1 people' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Everyone 1' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Raised hands/ })).not.toBeInTheDocument();
    rerender(<Subject people="one" filter="hands" />);
    expect(screen.getByText('No raised hands right now.')).toBeInTheDocument();
    rerender(<Subject people="one" filter="low" />);
    expect(screen.getByText('Everyone has been active.')).toBeInTheDocument();
    rerender(
      <ParticipantList
        hands={[]}
        others={[]}
        counts={{ all: 0, hands: 0, low: 0 }}
        filter="all"
        now={FIXTURE_NOW}
      />,
    );
    expect(screen.getByText('No one is here yet.')).toBeInTheDocument();
  });

  it('scales to thirty people and tells two Anas apart (B9)', () => {
    const { rerender } = render(<Subject people="thirty" />);
    expect(screen.getByRole('radio', { name: 'All 30 people' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Everyone 25' })).toBeInTheDocument();
    rerender(<Subject people="duplicateNames" />);
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Ana Ferreira')).toBeInTheDocument();
  });

  it('routes the row actions with the person id', async () => {
    const user = userEvent.setup();
    const onMessage = vi.fn();
    const onMenuOpenChange = vi.fn();
    const onAction = vi.fn();
    const { rerender } = render(
      <Subject onMessage={onMessage} onMenuOpenChange={onMenuOpenChange} onAction={onAction} />,
    );
    await user.click(screen.getByRole('button', { name: 'Message Bruno privately' }));
    expect(onMessage).toHaveBeenCalledWith('bruno');
    await user.click(screen.getByRole('button', { name: 'More actions for Anton Georgiev' }));
    expect(onMenuOpenChange).toHaveBeenCalledWith('anton', true);
    rerender(
      <Subject
        onMessage={onMessage}
        onMenuOpenChange={onMenuOpenChange}
        onAction={onAction}
        openMenu="anton"
      />,
    );
    const menu = await screen.findByRole('menu', { name: 'More actions for Anton Georgiev' });
    expect(menu).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Make presenter' }));
    expect(onAction).toHaveBeenCalledWith('anton', { type: 'makePresenter' });
    expect(onMenuOpenChange).toHaveBeenCalledWith('anton', false);
  });

  it('after a removal, focuses the next row’s ⋯ button, then the previous one, then the heading (WCAG 2.4.3)', async () => {
    const user = userEvent.setup();
    render(<Removable people="four" />);
    // Bruno (the one raised hand) is followed by Everyone: you (no ⋯), Frederick, Ellen.
    await remove(user, 'Bruno');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'More actions for Frederick Dixon' })).toHaveFocus(),
    );
    expect(screen.queryByRole('heading', { name: /Raised hands/ })).not.toBeInTheDocument();
    // Ellen is last: the previous row with actions is Frederick.
    await remove(user, 'Ellen');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'More actions for Frederick Dixon' })).toHaveFocus(),
    );
    // Frederick was the last person with actions: the section heading takes focus.
    await remove(user, 'Frederick Dixon');
    await waitFor(() => expect(screen.getByRole('heading', { level: 3, name: 'Everyone 1' })).toHaveFocus());
  });
});
