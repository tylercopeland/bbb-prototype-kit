import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, selectDisplayNames, type Participant } from '../../mocks';
import { VideoTile } from './VideoTile';

const room = createRoom();
const names = selectDisplayNames(room);
const by = (id: string): Participant => room.participants.find((p) => p.id === id)!;

const meta = {
  title: 'Components/VideoTile',
  component: VideoTile,
  // Tiles only ever sit on the stage.
  globals: { surface: 'stage' },
  args: {
    participant: by('frederick'),
    shortName: names.frederick,
    size: 'strip',
  },
  argTypes: {
    size: { control: 'radio', options: ['strip', 'grid'] },
    participant: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-start gap-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VideoTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Frederick: camera on, speaking. The green ring and the speaking badge together (X12). */
export const Speaking: Story = {};

/** Bruno: camera on, muted, hand up. */
export const MutedWithHand: Story = {
  args: { participant: by('bruno'), shortName: names.bruno },
};

/** Anton: camera on, muted. */
export const CameraOnMuted: Story = {
  args: { participant: by('anton'), shortName: names.anton },
};

/** Cibelle: camera off, hand up: the avatar stands in for the picture. */
export const CameraOff: Story = {
  args: { participant: by('cibelle'), shortName: names.cibelle },
};

/** Ellen listens only, camera off: no badge, the caption says "listening only". */
export const ListeningOnly: Story = {
  args: { participant: by('ellen'), shortName: names.ellen },
};

/** The teacher's own tile says "You", with the square avatar when the camera is off. */
export const You: Story = {
  args: { participant: { ...by('helena'), camera: false }, shortName: 'You' },
};

/** A long name truncates inside the plate. */
export const LongName: Story = {
  args: {
    participant: { ...by('michelle'), name: 'Michelle Winkler-Oppenheimer von Hohenstein' },
    shortName: 'Michelle Winkler-Oppenheimer von Hohenstein',
  },
};

/** The grid size fills its cell at 16:9 with the 48px avatar. */
export const Grid: Story = {
  args: { size: 'grid', participant: by('rafaela'), shortName: names.rafaela },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/** The strip's five tiles, as the room orders them (speaker, hands, cameras). */
export const Stage: Story = {
  render: (args) => (
    <>
      {['frederick', 'bruno', 'rafaela', 'cibelle', 'octavio'].map((id) => (
        <VideoTile {...args} key={id} participant={by(id)} shortName={names[id]} />
      ))}
    </>
  ),
};
