import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, FIXTURE_NOW, type Participant, type ParticipantFixture } from '../../mocks';
import { ParticipantRow } from './ParticipantRow';

const room = createRoom();
const by = (id: string, people: ParticipantFixture = 'class'): Participant =>
  createRoom({ participants: people }).participants.find((p) => p.id === id)!;

const meta = {
  title: 'Components/ParticipantRow',
  component: ParticipantRow,
  args: {
    participant: by('anton'),
    now: FIXTURE_NOW,
    showEngagement: false,
    isMenuOpen: false,
  },
  argTypes: {
    participant: { control: false },
    now: { control: false },
  },
  decorators: [
    (Story) => (
      <ul className="flex w-90 list-none flex-col gap-1 rounded-panel bg-surface p-2">
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof ParticipantRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Anton: muted, camera on. Hover or Tab into the row for Message privately and the ⋯ menu. */
export const Default: Story = {};

/** Every audio state and the second lines, as the canvas class has them. */
export const Statuses: Story = {
  render: (args) => (
    <>
      {['helena', 'frederick', 'bruno', 'cibelle', 'octavio', 'ellen', 'timo', 'lucas'].map((id) => (
        <ParticipantRow key={id} {...args} participant={by(id)} />
      ))}
    </>
  ),
};

/** Your own row: "(you)", presenting, and no actions. */
export const You: Story = {
  args: { participant: by('helena') },
};

/** The Low engagement filter shows the insight note as the second line. */
export const LowEngagement: Story = {
  args: { participant: by('timo'), showEngagement: true },
};

/** O2: the student actions menu open on Anton. */
export const MenuOpen: Story = {
  tags: ['wait-for-overlay'],
  args: { isMenuOpen: true },
};

/** The menu wired to local state: switches and the camera change the row. */
function Interactive(props: React.ComponentProps<typeof ParticipantRow>) {
  const [p, setP] = useState(props.participant);
  const [open, setOpen] = useState(false);
  return (
    <ParticipantRow
      {...props}
      participant={p}
      isMenuOpen={open}
      onMenuOpenChange={setOpen}
      onAction={(a) => {
        if (a.type === 'setCamera') setP({ ...p, camera: a.on });
        if (a.type === 'flag') setP({ ...p, [a.flag]: a.value });
        if (a.type === 'makePresenter') setP({ ...p, isPresenter: true });
        if (a.type === 'microphone') setP({ ...p, unmuteRequested: a.on, audio: a.on ? p.audio : 'muted' });
      }}
    />
  );
}

export const Playground: Story = {
  render: (args) => <Interactive {...args} />,
};

/** A long name truncates and shows in full in a tooltip on hover. */
export const LongName: Story = {
  args: { participant: by('michelle', 'longNames') },
};

/** Two Anas: the full names tell them apart (B9). */
export const DuplicateNames: Story = {
  render: (args) => (
    <>
      <ParticipantRow {...args} participant={by('ana', 'duplicateNames')} />
      <ParticipantRow {...args} participant={by('ana-ferreira', 'duplicateNames')} />
    </>
  ),
};

/** Thirty people: the rows at scale. */
export const ThirtyParticipants: Story = {
  render: (args) => (
    <>
      {createRoom({ participants: 'thirty' }).participants.map((p) => (
        <ParticipantRow key={p.id} {...args} participant={p} />
      ))}
    </>
  ),
};

/** Alone in the room: only your own row. */
export const OneParticipant: Story = {
  args: { participant: room.participants[0] },
};

export const Stage: Story = {
  globals: { surface: 'stage' },
  render: (args) => (
    <>
      <ParticipantRow {...args} participant={by('frederick')} />
      <ParticipantRow {...args} participant={by('bruno')} />
    </>
  ),
};
