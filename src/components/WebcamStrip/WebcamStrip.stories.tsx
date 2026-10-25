import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, selectDisplayNames, selectTileOrder, type ParticipantFixture } from '../../mocks';
import { WebcamStrip } from './WebcamStrip';

const forFixture = (people: ParticipantFixture) => {
  const state = createRoom({ participants: people });
  return { participants: selectTileOrder(state), names: selectDisplayNames(state) };
};

const meta = {
  title: 'Components/WebcamStrip',
  component: WebcamStrip,
  globals: { surface: 'stage' },
  args: {
    ...forFixture('class'),
    max: 5,
    direction: 'column',
  },
  argTypes: {
    direction: { control: 'radio', options: ['row', 'column'] },
    participants: { control: false },
    names: { control: false },
  },
} satisfies Meta<typeof WebcamStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Beside the slide: a column of five and "+9 more", from 14 people. */
export const Column: Story = {};

/** Above the slide when the panel is open: a row, with the more cell as a full tile. */
export const Row: Story = {
  args: { direction: 'row' },
};

/** Nobody yet (the room before anyone joins): an empty list named "Webcams" and no more button. */
export const NoParticipants: Story = {
  args: { participants: [], names: {} },
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-2">
        <Story />
        <p className="text-sm text-text-muted">No webcams: nobody has joined yet.</p>
      </div>
    ),
  ],
};

/** Alone in the room: your own tile and no more button. */
export const OneParticipant: Story = {
  args: forFixture('one'),
};

/** Four people fit, so there is no more button. */
export const FourParticipants: Story = {
  args: forFixture('four'),
};

/** Thirty people: the same five tiles and "+25 more". */
export const ThirtyParticipants: Story = {
  args: forFixture('thirty'),
};

/** Long names truncate inside the plates. */
export const LongNames: Story = {
  args: forFixture('longNames'),
};

/** Two Anas are told apart on the plates (B9). */
export const DuplicateNames: Story = {
  args: { ...forFixture('duplicateNames'), max: 15 },
};

export const Stage: Story = {
  args: { direction: 'row' },
};
