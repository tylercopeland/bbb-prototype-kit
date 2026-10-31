import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createRoom,
  roomReducer,
  roomStatus,
  selectDisplayNames,
  selectRooms,
  type RoomAction,
  type RoomState,
} from '../../mocks';
import { Announcer } from '../Announcer';
import { RoomCard, type RoomCardProps } from './RoomCard';

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state);

const setup = createRoom();
const live = run(setup, { type: 'openRooms' }, { type: 'requestHelp', roomIndex: 1, from: 'rafaela' });
const back = run(live, { type: 'bringEveryoneBack' });
const soloLive = run(setup, { type: 'setBreakoutMode', mode: 'solo' }, { type: 'openRooms' });
const names = selectDisplayNames(setup);
const rooms = selectRooms(setup);
const liveRooms = selectRooms(live);
const targets = rooms.map((r) => ({ index: r.index, name: r.name, count: r.members.length }));

/** A setup card that keeps the open menu itself; in the room the store holds `moving`. */
function SetupCard(props: Partial<RoomCardProps>) {
  const [moving, setMoving] = useState<string | null>(props.movingId ?? null);
  return (
    <RoomCard
      room={rooms[0]}
      names={names}
      variant="setup"
      moveTargets={targets}
      {...props}
      movingId={moving}
      onMoveMenuOpenChange={(id, open) => setMoving(open ? id : null)}
      onMove={() => setMoving(null)}
    />
  );
}

const meta = {
  title: 'Components/RoomCard',
  component: RoomCard,
  args: {
    room: liveRooms[0],
    names,
    variant: 'live',
    status: roomStatus(liveRooms[0], 'live', live.clock.now, names),
    density: 'default',
  },
  argTypes: {
    room: { control: false },
    names: { control: false },
    variant: { control: 'radio', options: ['setup', 'live', 'back'] },
    density: { control: 'radio', options: ['default', 'compact'] },
  },
  decorators: [
    (Story) => (
      <Announcer>
        <ul className="flex w-160 max-w-full list-none flex-wrap items-start gap-3 p-8">
          <Story />
        </ul>
      </Announcer>
    ),
  ],
} satisfies Meta<typeof RoomCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** BO2: a setup card with its member chips, each a "Move to…" menu trigger (B2). */
export const Setup: Story = {
  render: () => <SetupCard className="w-60" />,
};

/** BO3: Ana's "Move to…" menu is open; the current room is disabled in it. */
export const SetupMoving: Story = {
  tags: ['wait-for-overlay'],
  render: () => <SetupCard room={rooms[3]} movingId="ana" className="w-60" />,
};

/** A setup card with no one in it (B1). */
export const SetupEmpty: Story = {
  render: () => <SetupCard room={{ ...rooms[1], members: [] }} className="w-60" />,
};

/** Solo setup (BO4): the compact card names its one student under "Room N" (B7). */
export const SetupSolo: Story = {
  render: () => {
    const solo = run(setup, { type: 'setBreakoutMode', mode: 'solo' });
    return (
      <RoomCard
        room={selectRooms(solo)[0]}
        names={names}
        variant="setup"
        density="compact"
        className="w-40"
      />
    );
  },
};

/** Long names (the `longNames` fixture): the chips truncate and show the full name in a tooltip on hover or focus. */
export const SetupLongNames: Story = {
  render: () => {
    const long = createRoom({ participants: 'longNames' });
    const longNames = selectDisplayNames(long);
    const longRooms = selectRooms(long);
    return (
      <SetupCard
        room={longRooms[0]}
        names={longNames}
        moveTargets={longRooms.map((r) => ({ index: r.index, name: r.name, count: r.members.length }))}
        className="w-40"
      />
    );
  },
};

/** The card's width on the board; a `li` may not sit in a wrapper, so it goes on the card itself. */
const wide = { className: 'w-72' };

/** BO5: a live card, Ana and Bruno talking. */
export const Live: Story = {
  args: wide,
};

/** A room that asked for help: the amber border, the badge and the status say it (B3). */
export const LiveHelp: Story = {
  args: { ...wide, room: liveRooms[1], status: roomStatus(liveRooms[1], 'live', live.clock.now, names) },
};

/** The previewed room: the selected border and ring. */
export const LivePeeked: Story = {
  args: { ...wide, room: liveRooms[2], status: roomStatus(liveRooms[2], 'live', live.clock.now, names), isPeeked: true },
};

/** The room the teacher joined (B8): "You're here" instead of Join. */
export const LiveJoined: Story = {
  args: { ...wide, isJoined: true },
};

/** A live room with nobody in it (B1). */
export const LiveEmpty: Story = {
  args: { ...wide, room: { ...liveRooms[3], members: [] }, status: 'Empty' },
};

/** BO7: a solo room, compact, with its icon-only Join (B7: the same actions in both modes). */
export const LiveSolo: Story = {
  args: {
    room: selectRooms(soloLive)[0],
    status: roomStatus(selectRooms(soloLive)[0], 'live', soloLive.clock.now, names),
    density: 'compact',
    className: 'w-44',
  },
};

/** Thirty students in one room: the stack shows four and "+N". */
export const ManyMembers: Story = {
  render: () => {
    const big = run(createRoom({ participants: 'thirty' }), { type: 'setRoomCount', roomCount: 2 }, { type: 'openRooms' });
    const room = selectRooms(big)[0];
    return (
      <RoomCard
        room={room}
        names={selectDisplayNames(big)}
        variant="live"
        status={roomStatus(room, 'live', big.clock.now, selectDisplayNames(big))}
        className="w-72"
      />
    );
  },
};

/** BO11: after the rooms closed, the thumbnail and "Show on stage" put the work on the stage. */
export const Back: Story = {
  args: {
    room: selectRooms(back)[1],
    variant: 'back',
    status: roomStatus(selectRooms(back)[1], 'back', back.clock.now, names),
    ...wide,
  },
};

/** BO12: this room's work is on stage. */
export const BackOnStage: Story = {
  args: { ...Back.args, isOnStage: true },
};

/** On the stage, where the board sits: the stage tokens. */
export const Stage: Story = {
  args: { ...wide, room: liveRooms[1], status: roomStatus(liveRooms[1], 'live', live.clock.now, names) },
  globals: { surface: 'stage' },
};
