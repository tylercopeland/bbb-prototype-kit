import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: {
    count: 3,
    label: '3 unread',
    tone: 'neutral',
    inverted: false,
  },
  argTypes: {
    tone: { control: 'radio', options: ['neutral', 'urgent'] },
  },
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-4 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The one count style (X4): text on surface, inverted relative to where it sits. */
export const Neutral: Story = {};

/** Red only for counts that need attention now. */
export const Urgent: Story = {
  args: { tone: 'urgent', count: 2, label: '2 help requests' },
};

/** Above 99 the digits cap at "99+"; the label keeps the exact number. */
export const Overflow: Story = {
  render: (args) => (
    <>
      <Badge {...args} count={9} label="9 unread" />
      <Badge {...args} count={99} label="99 unread" />
      <Badge {...args} count={100} label="100 unread" />
      <Badge {...args} count={1240} label="1240 unread" />
    </>
  ),
};

/** Inside a selected (dark) chip the neutral badge swaps its pair; the chip story shows it in place. */
export const Inverted: Story = {
  args: { inverted: true, count: 14, label: '14 people' },
  render: (args) => (
    <span className="inline-flex items-center gap-2 rounded-full bg-text px-3 py-1 text-sm font-semibold text-surface">
      All <Badge {...args} />
    </span>
  ),
};

/** On the stage the neutral badge is white with stage text, as on the action bar. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  render: (args) => (
    <>
      <Badge {...args} />
      <Badge {...args} tone="urgent" count={2} label="2 help requests" />
      <Badge {...args} count={120} label="120 unread" />
    </>
  ),
};
