import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { decks, type InkColor, type WhiteboardTool } from '../../mocks';
import { PresentationControls } from './PresentationControls';

const deck = decks[0];

const meta = {
  title: 'Components/PresentationControls',
  component: PresentationControls,
  args: {
    deckName: deck.file,
    slides: deck.slides,
    slideIndex: 2,
    tool: 'pen',
    color: 'amber',
    isRevealed: true,
  },
  argTypes: {
    slides: { control: false },
  },
  decorators: [
    // A stand-in for the slide: the white paper, the hover group the controls live in.
    (Story) => (
      <div className="flex min-h-128 items-end p-8">
        <div className="group relative h-80 w-full rounded-tile bg-slide p-6 text-on-slide">
          <p className="text-xl font-bold">BigBlueButton 4.0, refined</p>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof PresentationControls>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Revealed, as on a touch device or while the slide is hovered or focused. */
export const Revealed: Story = {};

/** Hidden until the slide is hovered or holds focus (X13): hover the paper, or Tab into it. */
export const HiddenUntilHover: Story = {
  args: { isRevealed: false },
};

/** The first slide: Previous is disabled but still named and hoverable. */
export const FirstSlide: Story = {
  args: { slideIndex: 0 },
};

/** The last slide: Next is disabled. */
export const LastSlide: Story = {
  args: { slideIndex: deck.slides.length - 1 },
};

/** N1: the All slides dialog open over the controls, which stay visible meanwhile. */
export const OverviewOpen: Story = {
  tags: ['wait-for-overlay'],
  args: { overviewOpen: true, isRevealed: false },
};

/** Wired to local state: paging, All slides, the tool and the ink. */
function Interactive(props: React.ComponentProps<typeof PresentationControls>) {
  const [index, setIndex] = useState(props.slideIndex);
  const [overview, setOverview] = useState(false);
  const [tool, setTool] = useState<WhiteboardTool>(props.tool);
  const [color, setColor] = useState<InkColor>(props.color);
  return (
    <PresentationControls
      {...props}
      slideIndex={index}
      overviewOpen={overview}
      onOverviewChange={setOverview}
      onGoToSlide={(i) => {
        setIndex(i);
        setOverview(false);
      }}
      onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
      onNext={() => setIndex((i) => Math.min(props.slides.length - 1, i + 1))}
      tool={tool}
      color={color}
      onToolChange={setTool}
      onColorChange={setColor}
    />
  );
}

export const Playground: Story = {
  render: (args) => <Interactive {...args} />,
};

/** Inside the stage, over the paper: the dark cards the stage tokens give the controls. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
