import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createRoom,
  selectDeck,
  selectDisplayNames,
  selectSlideCount,
  selectTileOrder,
  type ParticipantFixture,
} from '../../mocks';
import { Stage as StageComponent, type StageLayout, type StagePresentation, type StageTab } from './Stage';

const forFixture = (people: ParticipantFixture) => {
  const state = createRoom({ participants: people });
  const deck = selectDeck(state)!;
  const presentation: StagePresentation = {
    deckName: deck.file,
    slideTitle: deck.slides[state.presentation.slideIndex],
    slideNumber: state.presentation.slideIndex + 1,
    slideCount: selectSlideCount(state),
  };
  return { participants: selectTileOrder(state), names: selectDisplayNames(state), presentation };
};

const meta = {
  title: 'Components/Stage',
  component: StageComponent,
  parameters: { layout: 'fullscreen' },
  args: {
    layout: 'presentation',
    webcams: 'side',
    maxTiles: 5,
    ...forFixture('class'),
  },
  argTypes: {
    layout: { control: 'radio', options: ['presentation', 'presenter', 'minimized', 'grid'] },
    webcams: { control: 'radio', options: ['side', 'top'] },
    participants: { control: false },
    names: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="flex h-dvh w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** F1: the slide with the webcam column beside it. */
export const Presentation: Story = {};

/** With the panel open the stage narrows, so the strip moves above the slide. */
export const WebcamsOnTop: Story = {
  args: { webcams: 'top' },
};

/** M1: a screen is shared and on stage; the tabs switch what everyone sees. */
export const PresenterScreen: Story = {
  args: { layout: 'presenter', share: { kind: 'Entire screen', showing: 'screen' } },
};

/** M2: the screen is still shared, but the slides are back on stage. */
export const PresenterSlides: Story = {
  args: { layout: 'presenter', share: { kind: 'A window', showing: 'slides' } },
};

/** The presentation minimized: every one of the 14 people as a tile, plus the presentation tile. */
export const Minimized: Story = {
  args: { layout: 'minimized' },
};

/** A 1:1 call minimized: two tiles. */
export const MinimizedOneParticipant: Story = {
  args: { layout: 'minimized', ...forFixture('one') },
};

/** Thirty people minimized: eight columns, four rows. */
export const MinimizedThirtyParticipants: Story = {
  args: { layout: 'minimized', ...forFixture('thirty') },
};

/** The strip with thirty people: five tiles and "+25 more". */
export const ThirtyParticipants: Story = {
  args: forFixture('thirty'),
};

/** Nothing to present: the grid alone. */
export const Grid: Story = {
  args: { layout: 'grid', ...forFixture('four') },
};

/** Long names truncate on the plates. */
export const LongNames: Story = {
  args: { layout: 'minimized', ...forFixture('longNames') },
};

/** Minimize and restore work, and the presenter tabs switch. */
function Interactive(props: React.ComponentProps<typeof StageComponent>) {
  const [layout, setLayout] = useState<StageLayout>(props.layout);
  const [showing, setShowing] = useState<StageTab>('screen');
  return (
    <StageComponent
      {...props}
      layout={layout}
      share={{ kind: 'Entire screen', showing }}
      onMinimize={() => setLayout('minimized')}
      onRestore={() => setLayout('presenter')}
      onShowingChange={setShowing}
    />
  );
}

export const Playground: Story = {
  args: { layout: 'presenter' },
  render: (args) => <Interactive {...args} />,
};

/** The stage is its own Surface; this is the default layout under the stage toolbar setting. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
