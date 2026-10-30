import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Announcer } from '../components/Announcer';
import { announcementsFor } from './announcements';
import { useRoom, useRoomDispatch } from './context';
import { createRoom, FIXTURE_NOW } from './fixtures';
import { roomReducer as reduce, type RoomAction } from './reducer';
import { RoomProvider } from './RoomProvider';
import { selectRaisedHands } from './selectors';
import { createRoomStore } from './store';
import { MINUTE } from './time';

function Hands() {
  const hands = useRoom(selectRaisedHands);
  const dispatch = useRoomDispatch();
  return (
    <div>
      <p>{hands.length} hands</p>
      <button type="button" onClick={() => dispatch({ type: 'raiseHand', participantId: 'anton' })}>
        Raise
      </button>
    </div>
  );
}

const polite = () => screen.getByRole('status');
const assertive = () => screen.getByRole('alert');

describe('RoomProvider', () => {
  it('provides the store and re-renders readers on change', () => {
    render(
      <RoomProvider initialState={createRoom()}>
        <Hands />
      </RoomProvider>,
    );
    expect(screen.getByText('4 hands')).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Raise' }).click());
    expect(screen.getByText('5 hands')).toBeInTheDocument();
  });

  it('accepts an outside store and ignores a later initialState', () => {
    const store = createRoomStore(createRoom({ participants: 'four' }));
    const { rerender } = render(
      <RoomProvider store={store}>
        <Hands />
      </RoomProvider>,
    );
    expect(screen.getByText('1 hands')).toBeInTheDocument();
    act(() => store.dispatch({ type: 'raiseHand', participantId: 'ellen' }));
    expect(screen.getByText('2 hands')).toBeInTheDocument();
    rerender(
      <RoomProvider store={store} initialState={createRoom()}>
        <Hands />
      </RoomProvider>,
    );
    expect(screen.getByText('2 hands')).toBeInTheDocument();
  });

  it('throws outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Hands />)).toThrow(/inside a RoomProvider/);
    vi.restoreAllMocks();
  });

  it('announces raised hands, messages and help politely, and closing rooms assertively', () => {
    const store = createRoomStore(createRoom());
    render(
      <Announcer>
        <RoomProvider store={store}>
          <Hands />
        </RoomProvider>
      </Announcer>,
    );
    act(() => store.dispatch({ type: 'raiseHand', participantId: 'anton' }));
    expect(polite()).toHaveTextContent('Anton raised their hand');
    // Your own hand is not announced: you pressed the toggle, and it reports its state.
    act(() => store.dispatch({ type: 'raiseHand', participantId: 'helena' }));
    expect(polite()).not.toHaveTextContent('Helena');
    act(() => store.dispatch({ type: 'removeParticipant', participantId: 'ellen' }));
    expect(polite()).toHaveTextContent('Ellen removed');
    act(() => store.dispatch({ type: 'sendMessage', from: 'bruno', text: 'Can we go back a slide?' }));
    expect(polite()).toHaveTextContent('Bruno: Can we go back a slide?');
    act(() => store.dispatch({ type: 'sendMessage', from: 'helena', text: 'Sure' }));
    expect(polite()).not.toHaveTextContent('Sure');
    act(() => store.dispatch({ type: 'openRooms' }));
    act(() => store.dispatch({ type: 'requestHelp', roomIndex: 1, from: 'rafaela' }));
    expect(polite()).toHaveTextContent('Room 2 (Rafaela) asked for help');
    expect(assertive()).toBeEmptyDOMElement();
    act(() => store.dispatch({ type: 'closeRooms' }));
    expect(assertive()).toHaveTextContent('Rooms close in 60 seconds');
    act(() => store.dispatch({ type: 'bringEveryoneBack' }));
    expect(assertive()).toHaveTextContent('Breakout rooms closed. Everyone is back in the main room');
  });

  it('exposes the mounted store as window.bbbRoom for the end-to-end tests, and removes it on unmount', () => {
    const store = createRoomStore(createRoom());
    const { unmount } = render(
      <RoomProvider store={store}>
        <Hands />
      </RoomProvider>,
    );
    expect(window.bbbRoom).toBe(store);
    unmount();
    expect(window.bbbRoom).toBeUndefined();
  });

  it('never announces the clock', () => {
    const store = createRoomStore(createRoom());
    render(
      <Announcer>
        <RoomProvider store={store}>
          <Hands />
        </RoomProvider>
      </Announcer>,
    );
    act(() => store.dispatch({ type: 'tick', now: FIXTURE_NOW + MINUTE }));
    act(() => store.dispatch({ type: 'tick', now: FIXTURE_NOW + 2 * MINUTE }));
    expect(polite()).toBeEmptyDOMElement();
    expect(assertive()).toBeEmptyDOMElement();
  });

  it('ticks the room clock once a second with liveClock', () => {
    vi.useFakeTimers();
    const store = createRoomStore(createRoom());
    render(
      <RoomProvider store={store} liveClock>
        <Hands />
      </RoomProvider>,
    );
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(store.getState().clock.now).toBeGreaterThanOrEqual(FIXTURE_NOW + 2000);
    vi.useRealTimers();
  });
});

describe('announcementsFor', () => {
  const after = (state = createRoom(), ...actions: RoomAction[]) => {
    const next = actions.reduce(reduce, state);
    return announcementsFor(state, next);
  };

  it('says nothing for an unchanged state or a tick', () => {
    const s = createRoom();
    expect(announcementsFor(s, s)).toEqual([]);
    expect(after(s, { type: 'tick', now: FIXTURE_NOW + 1000 })).toEqual([]);
  });

  it('names a direct message, a move, opened rooms, kept rooms and the timer', () => {
    expect(after(createRoom(), { type: 'sendMessage', from: 'bruno', to: 'helena', text: 'Hi' })).toEqual([
      { message: 'Direct message from Bruno: Hi', politeness: 'polite' },
    ]);
    expect(after(createRoom(), { type: 'moveParticipant', participantId: 'ana', roomIndex: 1 })).toEqual([
      { message: 'Ana moved to Room 2', politeness: 'polite' },
    ]);
    expect(after(createRoom(), { type: 'openRooms' })).toEqual([
      { message: '4 breakout rooms opened', politeness: 'polite' },
    ]);
    const closing = reduce(reduce(createRoom(), { type: 'openRooms' }), { type: 'closeRooms' });
    expect(after(closing, { type: 'keepRoomsOpen' })).toEqual([{ message: 'Rooms stay open', politeness: 'polite' }]);
    const running = reduce(reduce(createRoom(), { type: 'addTimer' }), { type: 'startTimer' });
    expect(after(running, { type: 'tick', now: FIXTURE_NOW + 10 * MINUTE })).toEqual([
      { message: 'Time’s up', politeness: 'assertive' },
    ]);
  });

  it('announces a poll answer as the running count, politely, and the timer’s move to a corner', () => {
    const liveP = reduce(reduce(createRoom(), { type: 'setupPoll' }), { type: 'startPoll' });
    expect(after(liveP, { type: 'answerPoll', option: 0 })).toEqual([
      { message: 'Poll: 1 of 13 answered', politeness: 'polite' },
    ]);
    // Showing the results or editing nothing says nothing; the bars are never read out.
    expect(after(liveP, { type: 'showPollResults', shown: true })).toEqual([]);
    const ready = reduce(createRoom(), { type: 'addTimer' });
    expect(after(ready, { type: 'setTimerCorner', corner: 'bottomLeft' })).toEqual([
      { message: 'Timer moved to bottom left', politeness: 'polite' },
    ]);
    // Starting, pausing and the ticking time are not announced (X10).
    const running = reduce(ready, { type: 'startTimer' });
    expect(after(ready, { type: 'startTimer' })).toEqual([]);
    expect(after(running, { type: 'tick', now: FIXTURE_NOW + 1000 })).toEqual([]);
  });

  it('uses the disambiguated short name (B9)', () => {
    const s = createRoom({ participants: 'duplicateNames' });
    expect(after(s, { type: 'raiseHand', participantId: 'timo' })).toEqual([
      { message: 'Timo raised their hand', politeness: 'polite' },
    ]);
    expect(after(s, { type: 'lowerHand', participantId: 'ana-ferreira' })).toEqual([]);
    expect(after(s, { type: 'sendMessage', from: 'ana-ferreira', text: 'Hello' })).toEqual([
      { message: 'Ana F.: Hello', politeness: 'polite' },
    ]);
  });
});
