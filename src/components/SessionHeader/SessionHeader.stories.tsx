import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, participantFixtures, selectElapsed } from '../../mocks';
import { SessionHeader } from './SessionHeader';

const room = createRoom();

const meta = {
  title: 'Components/SessionHeader',
  component: SessionHeader,
  args: {
    title: room.session.title,
    recording: room.session.recording,
    peopleCount: participantFixtures.class.length,
    elapsed: selectElapsed(room),
    layout: 'row',
  },
  argTypes: {
    layout: { control: 'radio', options: ['row', 'stacked'] },
  },
  decorators: [
    (Story) => (
      <div className="w-200 max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SessionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The canvas class: 14 people, recording, 29:36 in. */
export const Default: Story = {};

/** Alone in the room: "1 person". */
export const OneParticipant: Story = {
  args: { peopleCount: participantFixtures.one.length },
};

export const ThirtyParticipants: Story = {
  args: { peopleCount: participantFixtures.thirty.length },
};

/** A long title truncates; the count and clock never wrap. */
export const LongTitle: Story = {
  args: {
    title:
      'Hack Week: Brazil 2026 · Introduction to accessible video classrooms, part two of the afternoon session',
  },
  decorators: [
    (Story) => (
      <div className="w-120 max-w-full p-6">
        <Story />
      </div>
    ),
  ],
};

export const NotRecording: Story = {
  args: { recording: false },
};

/** A session over an hour long. */
export const LongSession: Story = {
  args: { elapsed: '1:02:05' },
};

/** The phone's header (MB1, `layout="stacked"`): the title on its own line, REC and the count under it, in a 358px column. */
export const Stacked: Story = {
  args: { layout: 'stacked' },
  decorators: [
    (Story) => (
      <div className="w-90 max-w-full p-4">
        <Story />
      </div>
    ),
  ],
};

/** Stacked on the stage, as the phone draws it. */
export const StackedOnStage: Story = {
  args: { layout: 'stacked' },
  globals: { surface: 'stage' },
  decorators: [
    (Story) => (
      <div className="w-90 max-w-full p-4">
        <Story />
      </div>
    ),
  ],
};

/** As it sits in the room, on the stage: white title, red-300 REC, muted meta. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
