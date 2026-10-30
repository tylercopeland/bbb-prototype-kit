import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { reactions, type ReactionKind } from '../../mocks';
import { IconButton } from '../IconButton';
import { Popover } from '../Popover';
import { ReactionTray } from './ReactionTray';

const meta = {
  title: 'Components/ReactionTray',
  component: ReactionTray,
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReactionTray>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The six reactions of the Mobile board's tray, shared with desktop. */
export const Default: Story = {};

/** Wired: the last reaction chosen. */
function Interactive(props: React.ComponentProps<typeof ReactionTray>) {
  const [last, setLast] = useState<ReactionKind | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <ReactionTray {...props} onReact={setLast} />
      <p className="text-sm text-text-muted">{last ? `You reacted: ${reactions[last].label}` : 'Pick one'}</p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <Interactive {...args} />,
};

/** As the action bar shows it: in the React popover, with the close button (X1). */
export const InPopover: Story = {
  tags: ['wait-for-overlay'],
  decorators: [
    (Story) => (
      <div className="flex min-h-64 items-end justify-center p-8">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Popover
      title="React"
      titleHidden
      defaultOpen
      trigger={<IconButton label="React" icon="react" variant="soft" size="touch" />}
    >
      <ReactionTray {...args} />
    </Popover>
  ),
};

/** Opened from the action bar on the stage: the popover stays a white panel. */
export const Stage: Story = {
  ...InPopover,
  globals: { surface: 'stage' },
};
