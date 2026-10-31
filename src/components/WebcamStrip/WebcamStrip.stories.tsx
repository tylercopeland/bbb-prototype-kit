import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, selectDisplayNames, selectTileOrder, type ParticipantFixture } from '../../mocks';
import { PresentationTile } from '../Stage';
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
    direction: { control: 'radio', options: ['row', 'column', 'grid'] },
    columns: { control: 'radio', options: [2, 3, 5] },
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

/** The phone's band (MB1): two columns of 16:9 tiles, the four that matter most and "+10 more" as a cell. */
export const Grid: Story = {
  args: { direction: 'grid', columns: 2, max: 4 },
  decorators: [
    (Story) => (
      <div className="w-90 max-w-full">
        <Story />
      </div>
    ),
  ],
};

/** Minimized in portrait (MB13): three columns, everyone. */
export const GridThreeColumns: Story = {
  args: { direction: 'grid', columns: 3, max: 30 },
  decorators: [
    (Story) => (
      <div className="w-90 max-w-full">
        <Story />
      </div>
    ),
  ],
};

/** Minimized in landscape (MB14): five columns across the width. */
export const GridFiveColumns: Story = {
  args: { direction: 'grid', columns: 5, max: 30 },
  decorators: [
    (Story) => (
      <div className="w-200 max-w-full">
        <Story />
      </div>
    ),
  ],
};

/** The minimized presentation as the first cell (`leading`, MB13), the whole tile its Restore button. */
export const GridWithLeading: Story = {
  args: {
    direction: 'grid',
    columns: 3,
    max: 30,
    'aria-label': 'Webcams and minimized presentation',
    leading: (
      <PresentationTile
        variant="button"
        slideTitle="BigBlueButton 4.0, refined"
        slideNumber={3}
        slideCount={12}
      />
    ),
  },
  argTypes: { leading: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-90 max-w-full">
        <Story />
      </div>
    ),
  ],
};

/** The grid with nobody: an empty list. */
export const GridNoParticipants: Story = {
  args: { direction: 'grid', participants: [], names: {} },
  decorators: [
    (Story) => (
      <div className="flex w-90 max-w-full flex-col gap-2">
        <Story />
        <p className="text-sm text-text-muted">No webcams: nobody has joined yet.</p>
      </div>
    ),
  ],
};

/** The grid alone in the room: one cell. */
export const GridOneParticipant: Story = {
  args: { direction: 'grid', ...forFixture('one') },
  decorators: [
    (Story) => (
      <div className="w-90 max-w-full">
        <Story />
      </div>
    ),
  ],
};

/** The grid with thirty people, capped at four: "+26 more". */
export const GridThirtyParticipants: Story = {
  args: { direction: 'grid', max: 4, ...forFixture('thirty') },
  decorators: [
    (Story) => (
      <div className="w-90 max-w-full">
        <Story />
      </div>
    ),
  ],
};

export const Stage: Story = {
  args: { direction: 'row' },
};
