import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { breakoutStudents, createRoom, roomReducer, type RoomAction, type RoomState } from '../../mocks';
import { Announcer } from '../Announcer';
import { BreakoutSetup } from './BreakoutSetup';

/** The panel wired to a store of its own, as the room wires it to the room store. */
function LiveSetup({ initial }: { initial: RoomState }) {
  const [state, setState] = useState(initial);
  const dispatch = (action: RoomAction) => setState((s) => roomReducer(s, action));
  const b = state.breakouts;
  return (
    <BreakoutSetup
      mode={b.mode}
      roomCount={b.roomCount}
      studentCount={breakoutStudents(state.participants).length}
      assignment={b.assignment}
      durationMin={b.durationMin}
      options={b.options}
      onModeChange={(mode) => dispatch({ type: 'setBreakoutMode', mode })}
      onRoomCountChange={(roomCount) => dispatch({ type: 'setRoomCount', roomCount })}
      onAssignmentChange={(assignment) => dispatch({ type: 'setBreakoutAssignment', assignment })}
      onDurationChange={(durationMin) => dispatch({ type: 'setBreakoutDuration', durationMin })}
      onOptionChange={(option, value) => dispatch({ type: 'setBreakoutOption', option, value })}
      onOpen={() => dispatch({ type: 'openRooms' })}
    />
  );
}

const room = createRoom();

const meta = {
  title: 'Components/BreakoutSetup',
  component: BreakoutSetup,
  args: {
    mode: room.breakouts.mode,
    roomCount: room.breakouts.roomCount,
    studentCount: breakoutStudents(room.participants).length,
    assignment: room.breakouts.assignment,
    durationMin: room.breakouts.durationMin,
    options: room.breakouts.options,
  },
  argTypes: {
    mode: { control: 'radio', options: ['groups', 'solo'] },
    assignment: { control: 'radio', options: ['even', 'choose'] },
    options: { control: false },
  },
  decorators: [
    (Story) => (
      <Announcer>
        <div className="flex h-200 w-panel max-w-full flex-col border border-border bg-surface text-text">
          <Story />
        </div>
      </Announcer>
    ),
  ],
} satisfies Meta<typeof BreakoutSetup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** BO2: four rooms, spread evenly, ten minutes, the slide sent to every room. */
export const Groups: Story = {
  render: () => <LiveSetup initial={room} />,
};

/** BO4: one room per student; the stepper and the assignment give way to the note. */
export const Solo: Story = {
  render: () => <LiveSetup initial={roomReducer(room, { type: 'setBreakoutMode', mode: 'solo' })} />,
};

/** Thirty students in the most rooms allowed (B6). */
export const FiftyRooms: Story = {
  render: () => (
    <LiveSetup
      initial={roomReducer(createRoom({ participants: 'thirty' }), { type: 'setRoomCount', roomCount: 50 })}
    />
  ),
};

/** One student: a single solo room. */
export const OneStudent: Story = {
  render: () => (
    <LiveSetup
      initial={roomReducer(createRoom({ participants: 'four' }), { type: 'setBreakoutMode', mode: 'solo' })}
    />
  ),
};

/** Props only, no store: the static panel. */
export const Static: Story = {};

/** Inside the stage, for the token check; the panel is always a white panel in the room. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  render: () => <LiveSetup initial={room} />,
};
