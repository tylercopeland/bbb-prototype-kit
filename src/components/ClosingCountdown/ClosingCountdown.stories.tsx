import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog } from '../Dialog';
import { ClosingCountdown } from './ClosingCountdown';

const meta = {
  title: 'Components/ClosingCountdown',
  component: ClosingCountdown,
  args: {
    leftSec: 60,
    variant: 'banner',
  },
  argTypes: {
    variant: { control: 'radio', options: ['banner', 'dialog'] },
  },
  decorators: [
    (Story) => (
      <div className="w-panel max-w-full p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ClosingCountdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The banner in the live panel's footer while the rooms are closing (B5). */
export const Banner: Story = {};

/** The last seconds. */
export const AlmostClosed: Story = {
  args: { leftSec: 4 },
};

/** BO10: inside the "Closing rooms" dialog the room opens when the countdown starts. */
export const InDialog: Story = {
  tags: ['wait-for-overlay'],
  render: (args) => (
    <Dialog
      isOpen
      onOpenChange={() => undefined}
      kicker="Wrapping up"
      kickerTone="hand"
      title="Closing rooms"
      description="Students see a countdown so they can finish their thought. Boards, notes and room chat are saved to Shared notes automatically."
    >
      <ClosingCountdown {...args} variant="dialog" />
    </Dialog>
  ),
};

/** On the stage, for the token check; the banner lives in the white panel. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
