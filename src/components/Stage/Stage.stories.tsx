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
import { Surface } from '../Surface';
import {
  PresentationTile,
  Stage as StageComponent,
  StageSlide,
  type StageLayout,
  type StagePresentation,
  type StageTab,
} from './Stage';

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

/** Nothing to present and nobody in the room: an empty grid named "Webcams". */
export const EmptyGrid: Story = {
  args: { layout: 'grid', participants: [], names: {} },
  decorators: [
    (Story) => (
      <div className="relative flex h-dvh w-full">
        <Story />
        <p className="absolute inset-x-0 bottom-4 text-center text-sm text-text-on-stage-muted">
          Empty stage: nobody has joined yet.
        </p>
      </div>
    ),
  ],
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

/** The phone's slide in portrait (MB1, `StageSlide webcams="below"`): full width, 16:9, the webcams under it. */
export const SlideBelow: Story = {
  render: (args) => (
    <Surface kind="stage" className="flex w-96 max-w-full flex-col gap-3 bg-surface-stage p-4">
      <StageSlide {...args.presentation!} webcams="below" />
      <p className="text-sm text-text-muted">The webcam band sits here.</p>
    </Surface>
  ),
};

/** The phone's slide in landscape (MB8, `StageSlide webcams="beside"`): fitted by height, the webcams beside it. */
export const SlideBeside: Story = {
  render: (args) => (
    <Surface kind="stage" className="flex h-80 w-full gap-3 bg-surface-stage p-4">
      <div className="container-size flex min-h-0 min-w-0 flex-1 items-center justify-center">
        <StageSlide {...args.presentation!} webcams="beside" />
      </div>
      <p className="w-60 shrink-0 text-sm text-text-muted">The webcam column sits here.</p>
    </Surface>
  ),
};

/** The minimized presentation as a whole-tile Restore button (MB13, `PresentationTile variant="button"`), among 16:9 cells. */
export const PresentationTileButton: Story = {
  render: (args) => (
    <Surface kind="stage" className="bg-surface-stage p-4">
      <ul
        aria-label="Webcams and minimized presentation"
        className="grid w-90 max-w-full list-none grid-cols-3 gap-2 p-0"
      >
        <PresentationTile {...args.presentation!} variant="button" />
        <PresentationTile {...args.presentation!} variant="tile" />
      </ul>
    </Surface>
  ),
};

/** The stage is its own Surface; this is the default layout under the stage toolbar setting. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
