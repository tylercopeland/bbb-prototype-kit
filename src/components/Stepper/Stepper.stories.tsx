import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stepper } from './Stepper';

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  args: {
    label: 'Rooms',
    defaultValue: 4,
    minValue: 2,
    maxValue: 50,
    step: 1,
    size: 'lg',
    isDisabled: false,
    description: 'About 3 students per room',
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg', 'touch'] },
  },
  decorators: [
    (Story) => (
      <div className="w-80 rounded-panel bg-surface p-4 text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The breakout room count (Breakout.dc.html 228–235): 2 to 50 rooms (B6), with the per-room note. */
export const Rooms: Story = {};

/** At the minimum the − button is disabled. */
export const AtMinimum: Story = {
  args: { defaultValue: 2, description: 'Two rooms, about 7 students each' },
};

/** At the maximum (about 50 rooms, B6) the + button is disabled. */
export const AtMaximum: Story = {
  args: { defaultValue: 50, description: '50 rooms, one student each' },
};

/** Without a description. */
export const LabelOnly: Story = {
  args: { description: undefined },
};

/** Custom button labels, when "Fewer" and "More" do not fit the field. */
export const CustomButtonLabels: Story = {
  args: {
    label: 'Minutes',
    defaultValue: 10,
    minValue: 1,
    maxValue: 120,
    step: 5,
    description: undefined,
    decrementLabel: 'Shorter',
    incrementLabel: 'Longer',
  },
};

/** 44px buttons for the phone. */
export const Touch: Story = {
  args: { size: 'touch' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

/** On the stage. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};
