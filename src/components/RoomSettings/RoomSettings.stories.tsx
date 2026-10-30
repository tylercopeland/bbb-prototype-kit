import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from '../IconButton';
import { Popover } from '../Popover';
import { RoomSettings } from './RoomSettings';

const meta = {
  title: 'Components/RoomSettings',
  component: RoomSettings,
  args: {
    privateChat: true,
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-center justify-center p-8">
        <div className="rounded-xl border border-border bg-surface p-3 text-text shadow-overlay">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof RoomSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Private chat on: the default. */
export const On: Story = {};

/** Private chat off: students see no "Message privately" (owner decision 2026-10-30). */
export const Off: Story = {
  args: { privateChat: false },
};

/** Wired to local state. */
function Interactive(props: React.ComponentProps<typeof RoomSettings>) {
  const [on, setOn] = useState(props.privateChat);
  return <RoomSettings {...props} privateChat={on} onPrivateChatChange={setOn} />;
}

export const Playground: Story = {
  render: (args) => <Interactive {...args} />,
};

/** As the action bar shows it: in the Room settings popover with its title and close button. */
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
      title="Room settings"
      defaultOpen
      trigger={<IconButton label="Room settings" icon="settings" variant="soft" size="touch" />}
    >
      <RoomSettings {...args} />
    </Popover>
  ),
};

/** Opened from the action bar on the stage: the popover stays a white panel. */
export const Stage: Story = {
  ...InPopover,
  globals: { surface: 'stage' },
};
