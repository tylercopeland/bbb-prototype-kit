import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextToggle } from './TextToggle';

const meta = {
  title: 'Components/TextToggle',
  component: TextToggle,
  args: {
    children: 'Raise hand',
    icon: 'raiseHand',
    selectedTone: 'hand',
    size: 'touch',
    shortcut: 'raiseHand',
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg', 'touch'] },
    selectedTone: { control: 'radio', options: ['accent', 'hand'] },
    icon: { control: false },
    selectedIcon: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-72 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The React sheet's Raise hand row (Mobile.dc.html 105), hand down. */
export const Default: Story = {};

/** Hand up: the amber fill, the inset ring and `aria-pressed="true"`; the label does not change. */
export const Selected: Story = {
  args: { defaultSelected: true },
};

/** The accent pair, for a toggle that is not the hand. */
export const Accent: Story = {
  args: { children: 'Show results', icon: 'poll', selectedTone: 'accent', defaultSelected: true, shortcut: undefined },
};

/** Every control size. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <TextToggle {...args} size="sm" />
      <TextToggle {...args} size="md" />
      <TextToggle {...args} size="lg" />
      <TextToggle {...args} size="touch" />
    </div>
  ),
};

/** Disabled: natively, since the text names it. */
export const Disabled: Story = {
  args: { isDisabled: true },
};

/** On the stage: the soft fill takes the stage ramp. */
export const Stage: Story = {
  args: { defaultSelected: true },
  globals: { surface: 'stage' },
};
