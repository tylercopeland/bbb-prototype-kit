import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createRoom,
  roomReducer,
  roomStatus,
  roomTalkTime,
  selectDisplayNames,
  selectRoomMessages,
  selectRooms,
  type RoomAction,
  type RoomState,
} from '../../mocks';
import { Announcer } from '../Announcer';
import { Button } from '../Button';
import { RoomPreview, type RoomPreviewProps } from './RoomPreview';

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state);

const live = run(
  createRoom(),
  { type: 'openRooms' },
  { type: 'requestHelp', roomIndex: 1, from: 'rafaela' },
  { type: 'sendRoomMessage', roomIndex: 1, from: 'rafaela', text: 'Let’s each add two notes first' },
  { type: 'sendRoomMessage', roomIndex: 1, from: 'anton', text: 'We’re stuck on what “live” means, can the teacher pop in?' },
  { type: 'sendRoomMessage', roomIndex: null, from: 'helena', text: '5 minutes left, pick one idea' },
);
const solo = run(createRoom(), { type: 'setBreakoutMode', mode: 'solo' }, { type: 'openRooms' });

function propsFor(state: RoomState, index: number): Omit<RoomPreviewProps, 'isOpen' | 'onOpenChange'> {
  const rooms = selectRooms(state);
  const room = rooms[index];
  const names = selectDisplayNames(state);
  return {
    room,
    roomCount: rooms.length,
    names,
    status: roomStatus(room, 'live', state.clock.now, names),
    talk: roomTalkTime(room, state.breakouts.talkTime),
    messages: selectRoomMessages(index)(state),
    fullNames: Object.fromEntries(state.participants.map((p) => [p.id, p.name])),
    selfId: 'helena',
    solo: state.breakouts.mode === 'solo',
  };
}

/** Opens from a button and keeps the listen state and the room index itself; in the room the store does. */
function Demo({ state, index, defaultOpen = false }: { state: RoomState; index: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [current, setCurrent] = useState(index);
  const [listening, setListening] = useState(false);
  const count = selectRooms(state).length;
  return (
    <>
      <Button onPress={() => setOpen(true)}>Preview Room {current + 1}</Button>
      <RoomPreview
        {...propsFor(state, current)}
        isOpen={open}
        onOpenChange={setOpen}
        isListening={listening}
        onListeningChange={setListening}
        onPrevious={() => setCurrent((c) => (c - 1 + count) % count)}
        onNext={() => setCurrent((c) => (c + 1) % count)}
        onJoin={() => setOpen(false)}
      />
    </>
  );
}

const meta = {
  title: 'Components/RoomPreview',
  component: RoomPreview,
  args: { ...propsFor(live, 1), isOpen: true, onOpenChange: () => undefined },
  argTypes: {
    room: { control: false },
    names: { control: false },
    talk: { control: false },
    messages: { control: false },
    fullNames: { control: false },
  },
  decorators: [
    (Story) => (
      <Announcer>
        <div className="flex min-h-120 items-start justify-center p-8">
          <Story />
        </div>
      </Announcer>
    ),
  ],
} satisfies Meta<typeof RoomPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** BO6: Room 2 asked for help; its chat says why, and the teacher's broadcast shows too. */
export const GroupRoom: Story = {
  tags: ['wait-for-overlay'],
  render: () => <Demo state={live} index={1} defaultOpen />,
};

/** A quiet room with no messages yet. */
export const QuietRoom: Story = {
  tags: ['wait-for-overlay'],
  render: () => <Demo state={live} index={2} defaultOpen />,
};

/** BO8: one student working solo; the talk time says so instead of bars (B7). */
export const SoloRoom: Story = {
  tags: ['wait-for-overlay'],
  render: () => <Demo state={solo} index={2} defaultOpen />,
};

/** Long names (the `longNames` fixture): the talk-time names truncate and show in full in a tooltip on hover. */
export const LongNames: Story = {
  tags: ['wait-for-overlay'],
  render: () => {
    const long = run(createRoom({ participants: 'longNames' }), { type: 'openRooms' });
    const longest = long.participants.reduce((a, b) => (b.name.length > a.name.length ? b : a));
    const index = selectRooms(long).find((r) => r.members.some((m) => m.id === longest.id))?.index ?? 0;
    return <Demo state={long} index={index} defaultOpen />;
  },
};

/** A room with nobody in it (B1): the preview still opens. */
export const EmptyRoom: Story = {
  tags: ['wait-for-overlay'],
  args: { room: { ...propsFor(live, 3).room, members: [] }, status: 'Empty', talk: [], messages: [] },
};

/** Closed, with the button that opens it: focus returns there. */
export const Closed: Story = {
  render: () => <Demo state={live} index={0} />,
};

/** Opened from the stage: still a white panel (owner decision 2026-10-24). */
export const Stage: Story = {
  tags: ['wait-for-overlay'],
  globals: { surface: 'stage' },
  render: () => <Demo state={live} index={0} defaultOpen />,
};
