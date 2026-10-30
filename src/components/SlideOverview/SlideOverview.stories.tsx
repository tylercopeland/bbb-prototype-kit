import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { decks } from '../../mocks';
import { SlideOverview } from './SlideOverview';

const deck = decks[0];

const meta = {
  title: 'Components/SlideOverview',
  component: SlideOverview,
  args: {
    deckName: deck.file,
    slides: deck.slides,
    currentIndex: 2,
  },
  argTypes: {
    slides: { control: false },
  },
  decorators: [
    // Room for the dialog above its trigger, so nothing clips while axe measures it.
    (Story) => (
      <div className="flex min-h-128 items-end justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SlideOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The closed "All slides" trigger. Press it. */
export const Default: Story = {};

/** N1: the twelve slides of the canvas deck, slide 3 current. */
export const Open: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true },
};

/** A short deck: one row. */
export const ThreeSlides: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true, deckName: decks[1].file, slides: decks[1].slides, currentIndex: 0 },
};

/** Thirty slides: the dialog scrolls. */
export const ThirtySlides: Story = {
  tags: ['wait-for-overlay'],
  args: {
    defaultOpen: true,
    deckName: 'long-lecture.pdf',
    slides: Array.from(
      { length: 30 },
      (_, i) => `Section ${i + 1}: a longer title that is cut off in the caption`,
    ),
    currentIndex: 17,
  },
};

/** A deck with no slides. */
export const Empty: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true, deckName: 'empty.pdf', slides: [], currentIndex: 0 },
};

/** Controlled: picking a slide moves the current mark and closes the dialog, as the room does. */
function Interactive(props: React.ComponentProps<typeof SlideOverview>) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(props.currentIndex);
  return (
    <SlideOverview
      {...props}
      currentIndex={current}
      isOpen={open}
      onOpenChange={setOpen}
      onPick={(i) => {
        setCurrent(i);
        setOpen(false);
      }}
    />
  );
}

export const Playground: Story = {
  render: (args) => <Interactive {...args} />,
};

/** Opened from the presentation controls on the stage: the dialog is a white panel. */
export const Stage: Story = {
  tags: ['wait-for-overlay'],
  globals: { surface: 'stage' },
  args: { defaultOpen: true },
};
