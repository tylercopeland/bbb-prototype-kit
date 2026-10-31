import type { Meta, StoryObj } from '@storybook/react-vite';
import { UpdatesPill } from './UpdatesPill';

const meta = {
  title: 'Components/UpdatesPill',
  component: UpdatesPill,
  args: {
    kinds: ['hands', 'question', 'insight'],
    description: 'Opens the updates sheet',
  },
  argTypes: {
    kinds: { control: 'object' },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UpdatesPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The canvas's "3 updates" (Mobile.dc.html 31): hands, a question and the insight. */
export const Default: Story = {};

/** One alert: "1 update" with one disc. */
export const One: Story = {
  args: { kinds: ['question'] },
};

/** Five alerts: the text counts them all, the stack keeps three discs. */
export const Many: Story = {
  args: { kinds: ['help', 'hands', 'question', 'insight', 'back'] },
};

/** On the stage, where the session header puts it. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
