import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createRoom,
  roomReducer,
  selectDisplayNames,
  selectHelpQueue,
  type RoomAction,
  type RoomState,
} from '../../mocks';
import { MINUTE } from '../../mocks/time';
import { HelpQueue, helpTitle } from './HelpQueue';

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state);
const live = run(createRoom(), { type: 'openRooms' });
const two = run(
  live,
  { type: 'requestHelp', roomIndex: 1, from: 'rafaela' },
  { type: 'tick', now: live.clock.now + MINUTE },
  { type: 'requestHelp', roomIndex: 3, from: 'octavio' },
  { type: 'tick', now: live.clock.now + 2 * MINUTE },
);

function Demo({ initial }: { initial: RoomState }) {
  const [state, setState] = useState(initial);
  const dispatch = (action: RoomAction) => setState((s) => roomReducer(s, action));
  return (
    <HelpQueue
      requests={selectHelpQueue(state)}
      names={selectDisplayNames(state)}
      now={state.clock.now}
      onOpen={() => undefined}
      onAcknowledge={(id) => dispatch({ type: 'acknowledgeHelp', id })}
      onClear={(id) => dispatch({ type: 'clearHelp', id })}
    />
  );
}

describe('HelpQueue', () => {
  it('lists the requests from data, open and oldest first, with who asked and when (B3)', () => {
    render(<Demo initial={two} />);
    const section = screen.getByRole('region', { name: 'Help requests 2' });
    const rows = within(section).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual(['Room 2 · RafaelaAsked 2 min ago', 'Room 4 · OctavioAsked 1 min ago']);
    expect(helpTitle({ id: 'x', roomIndex: 0, from: null, askedAt: 0, acknowledgedAt: null }, {})).toBe('Room 1');
  });

  it('shows an empty state', () => {
    render(<Demo initial={live} />);
    expect(screen.getByText('No room has asked for help.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Help requests' })).toBeInTheDocument();
  });

  it('acknowledges by keyboard, focusing Clear, then clears and moves focus to the next row', async () => {
    const user = userEvent.setup();
    render(<Demo initial={two} />);
    const ack = screen.getByRole('button', { name: 'Acknowledge Room 2 · Rafaela' });
    ack.focus();
    await user.keyboard('{Enter}');
    // The acknowledged row drops below the open one and says so; its Clear took focus.
    const rows = screen.getAllByRole('listitem');
    expect(rows[1]).toHaveTextContent('Room 2 · RafaelaAcknowledged');
    const clear = screen.getByRole('button', { name: 'Clear Room 2 · Rafaela' });
    expect(clear).toHaveFocus();
    expect(screen.getByRole('region', { name: 'Help requests 1' })).toBeInTheDocument();
    await user.keyboard(' ');
    expect(screen.queryByText(/Rafaela/)).not.toBeInTheDocument();
    // The next row (none after it) then the previous one: Room 4's Preview button.
    expect(screen.getByRole('button', { name: 'Preview Room 4 · Octavio' })).toHaveFocus();
  });

  it('moves focus to the heading when the last request is cleared', async () => {
    const user = userEvent.setup();
    const one = run(live, { type: 'requestHelp', roomIndex: 0 }, { type: 'acknowledgeHelp', id: 'help-1' });
    render(<Demo initial={one} />);
    await user.click(screen.getByRole('button', { name: 'Clear Room 1' }));
    expect(screen.getByRole('heading', { name: 'Help requests' })).toHaveFocus();
    expect(screen.getByText('No room has asked for help.')).toBeInTheDocument();
  });
});
