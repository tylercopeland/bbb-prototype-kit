import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { decks, type MediaType } from '../../mocks';
import { IconButton } from '../IconButton';
import { Popover } from '../Popover';
import { MediaPicker, type MediaAction } from './MediaPicker';

const meta = {
  title: 'Components/MediaPicker',
  component: MediaPicker,
  args: {
    decks,
    deckIndex: 0,
    mediaType: 'slides',
  },
  argTypes: {
    decks: { control: false },
    mediaType: { control: 'radio', options: ['slides', 'video', 'screen', 'audio', 'url', 'more'] },
  },
  decorators: [
    // The card the action bar's Popover draws around the content.
    (Story) => (
      <div className="flex min-h-96 items-end justify-center p-8">
        <div className="w-112 max-w-full rounded-xl border border-border bg-surface p-3 text-text shadow-overlay">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof MediaPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** H1: Add slides and your decks, the presented one checked. */
export const Slides: Story = {};

/** H2: entire screen, a window or a browser tab. */
export const Screen: Story = {
  args: { mediaType: 'screen' },
};

/** A link to share; the button enables once one is typed. */
export const Video: Story = {
  args: { mediaType: 'video' },
};

export const Audio: Story = {
  args: { mediaType: 'audio' },
};

export const Url: Story = {
  args: { mediaType: 'url' },
};

export const More: Story = {
  args: { mediaType: 'more' },
};

/** A room with no deck yet: only Add slides. */
export const NoDecks: Story = {
  args: { decks: [], deckIndex: 0 },
};

/** Many decks: the grid grows. */
export const ManyDecks: Story = {
  args: {
    decks: Array.from({ length: 9 }, (_, i) => ({
      file: `week-${i + 1}-a-rather-long-file-name.pdf`,
      slides: [`Week ${i + 1}`],
    })),
    deckIndex: 4,
  },
};

/** Wired to local state: switch the type, present a deck, see what the picker asked for. */
function Interactive(props: React.ComponentProps<typeof MediaPicker>) {
  const [type, setType] = useState<MediaType>(props.mediaType);
  const [deckIndex, setDeckIndex] = useState(props.deckIndex);
  const [last, setLast] = useState<MediaAction | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <MediaPicker
        {...props}
        mediaType={type}
        deckIndex={deckIndex}
        onMediaTypeChange={setType}
        onPick={(action) => {
          setLast(action);
          if (action.type === 'deck') setDeckIndex(action.index);
        }}
      />
      <p className="text-sm text-text-muted">
        {last ? `Picked: ${JSON.stringify(last)}` : 'Nothing picked yet'}
      </p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <Interactive {...args} />,
};

/** As the action bar shows it: inside the Share media popover, title hidden, close button on top. */
export const InPopover: Story = {
  tags: ['wait-for-overlay'],
  decorators: [
    (Story) => (
      // Tall enough for the whole picker above its trigger: a scrolling card's clipped rows would be measured against the page behind it.
      <div className="flex min-h-176 items-end justify-center p-8">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Popover
      title="Share media"
      titleHidden
      defaultOpen
      className="w-112"
      trigger={<IconButton label="Share media" icon="shareMedia" variant="soft" size="touch" />}
    >
      <MediaPicker {...args} />
    </Popover>
  ),
};

/** Opened from the action bar on the stage: the popover stays a white panel. */
export const Stage: Story = {
  ...InPopover,
  globals: { surface: 'stage' },
};
