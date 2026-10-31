import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createRoom,
  roomReducer,
  selectDisplayNames,
  selectHelpQueue,
  type RoomAction,
  type RoomState,
} from '../../mocks';
import { MINUTE } from '../../mocks/time';
import { Announcer } from '../Announcer';
import { HelpQueue } from './HelpQueue';

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state);

const live = run(createRoom(), { type: 'openRooms' });
const two = run(
  live,
  { type: 'requestHelp', roomIndex: 1, from: 'rafaela' },
  { type: 'tick', now: live.clock.now + MINUTE },
  { type: 'requestHelp', roomIndex: 3, from: 'octavio' },
  { type: 'tick', now: live.clock.now + 2 * MINUTE },
);
const acknowledged = run(two, { type: 'acknowledgeHelp', id: 'help-1' });
const names = selectDisplayNames(live);

/** Keeps the queue in a store of its own, so Acknowledge and Clear work here as in the room. */
function LiveQueue({ initial }: { initial: RoomState }) {
  const [state, setState] = useState(initial);
  const dispatch = (action: RoomAction) => setState((s) => roomReducer(s, action));
  return (
    <HelpQueue
      requests={selectHelpQueue(state)}
      names={selectDisplayNames(state)}
      now={state.clock.now}
      onAcknowledge={(id) => dispatch({ type: 'acknowledgeHelp', id })}
      onClear={(id) => dispatch({ type: 'clearHelp', id })}
    />
  );
}

const meta = {
  title: 'Components/HelpQueue',
  component: HelpQueue,
  args: {
    requests: selectHelpQueue(two),
    names,
    now: two.clock.now,
  },
  argTypes: {
    requests: { control: false },
    names: { control: false },
  },
  decorators: [
    (Story) => (
      <Announcer>
        <div className="w-panel max-w-full p-4">
          <Story />
        </div>
      </Announcer>
    ),
  ],
} satisfies Meta<typeof HelpQueue>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two open requests, oldest first (B3). */
export const Open: Story = {
  render: () => <LiveQueue initial={two} />,
};

/** One acknowledged, one still open: the open one comes first. */
export const Acknowledged: Story = {
  render: () => <LiveQueue initial={acknowledged} />,
};

/** No requests. */
export const Empty: Story = {
  args: { requests: [] },
};

/** A request from a room whose student left: just the room name. */
export const NoName: Story = {
  args: { requests: [{ id: 'help-9', roomIndex: 2, from: null, askedAt: live.clock.now, acknowledgedAt: null }] },
};

/** Many rooms asking at once (thirty students, solo). */
export const Many: Story = {
  render: () => {
    let state = run(createRoom({ participants: 'thirty' }), { type: 'setBreakoutMode', mode: 'solo' }, { type: 'openRooms' });
    for (let i = 0; i < 8; i++) {
      state = run(state, { type: 'requestHelp', roomIndex: i * 3 }, { type: 'tick', now: state.clock.now + 20_000 });
    }
    return <LiveQueue initial={state} />;
  },
};

/** On the stage, for the token check; the queue lives in the white panel. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  render: () => <LiveQueue initial={two} />,
};
