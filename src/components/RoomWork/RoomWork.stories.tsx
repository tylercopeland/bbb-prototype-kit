import type { Meta, StoryObj } from '@storybook/react-vite';
import { RoomWork } from './RoomWork';

const meta = {
  title: 'Components/RoomWork',
  component: RoomWork,
  args: {
    kind: 'board',
    size: 'thumb',
    showLabel: true,
  },
  argTypes: {
    kind: { control: 'radio', options: ['board', 'doc', 'quiz', 'slide'] },
    size: { control: 'radio', options: ['thumb', 'full'] },
  },
  decorators: [
    (Story) => (
      <div className="flex w-160 max-w-full flex-wrap items-start gap-4 p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoomWork>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The thumbnail on a room card. */
export const Thumb: Story = {
  decorators: [
    (Story) => (
      <div className="w-60">
        <Story />
      </div>
    ),
  ],
};

/** All four kinds side by side, as thumbnails. */
export const Kinds: Story = {
  render: (args) => (
    <>
      <RoomWork {...args} kind="board" className="w-36" />
      <RoomWork {...args} kind="doc" className="w-36" />
      <RoomWork {...args} kind="quiz" className="w-36" />
      <RoomWork {...args} kind="slide" className="w-36" />
    </>
  ),
};

/** Full size, as the preview and the stage show it. */
export const Full: Story = {
  args: { size: 'full', kind: 'doc' },
};

/** Without the label: the card's footer names the kind instead. */
export const NoLabel: Story = {
  args: { showLabel: false, kind: 'quiz' },
  decorators: [
    (Story) => (
      <div className="w-60">
        <Story />
      </div>
    ),
  ],
};

/** On the stage: the paper stays white, like the slide. */
export const Stage: Story = {
  args: { size: 'full', kind: 'board' },
  globals: { surface: 'stage' },
};
