import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip, ChipGroup } from './ChipGroup';

const meta = {
  title: 'Components/ChipGroup',
  component: ChipGroup,
  args: {
    // Every story renders its own chips; this satisfies the required prop.
    children: null,
    label: 'Filter people',
    labelHidden: true,
    defaultValue: 'all',
    orientation: 'horizontal',
    isDisabled: false,
  },
  argTypes: {
    children: { control: false },
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
  },
  decorators: [
    (Story) => (
      <div className="w-80 rounded-panel bg-surface p-4 text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChipGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The People filters (Focus.dc.html 580–584): All, Raised hands, Low engagement, each with its count (X8). */
export const PeopleFilters: Story = {
  render: (args) => (
    <ChipGroup {...args}>
      <Chip value="all" badge={{ count: 14, label: '14 people' }}>
        All
      </Chip>
      <Chip value="hands" badge={{ count: 4, label: '4 people' }}>
        Raised hands
      </Chip>
      <Chip value="low" badge={{ count: 3, label: '3 people' }}>
        Low engagement
      </Chip>
    </ChipGroup>
  ),
};

/** The breakout durations (Breakout.dc.html 254–256) under a visible "Time" label, stretched to fill the row. */
export const Durations: Story = {
  args: { label: 'Time', labelHidden: false, defaultValue: '10' },
  render: (args) => (
    <ChipGroup {...args}>
      {['5', '10', '15', '20', '30'].map((minutes) => (
        <Chip key={minutes} value={minutes} className="flex-1">
          {`${minutes} min`}
        </Chip>
      ))}
    </ChipGroup>
  ),
};

/** The timer presets (Focus.dc.html 192). */
export const TimerPresets: Story = {
  args: { label: 'Timer presets', defaultValue: '5' },
  render: (args) => (
    <ChipGroup {...args}>
      <Chip value="1">1 min</Chip>
      <Chip value="5">5 min</Chip>
      <Chip value="10">10 min</Chip>
      <Chip value="custom">Custom</Chip>
    </ChipGroup>
  ),
};

/** Nothing checked yet: Tab lands on the first chip, and the arrow keys or Space check one. */
export const NoneSelected: Story = {
  args: { defaultValue: undefined, label: 'Timer presets' },
  render: (args) => (
    <ChipGroup {...args}>
      <Chip value="1">1 min</Chip>
      <Chip value="5">5 min</Chip>
      <Chip value="10">10 min</Chip>
    </ChipGroup>
  ),
};

/** One chip and many chips: the row wraps. */
export const Counts: Story = {
  args: { label: 'Rooms', defaultValue: 'r1' },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <ChipGroup {...args} label="One room">
        <Chip value="r1">Room 1</Chip>
      </ChipGroup>
      <ChipGroup {...args} label="Fourteen rooms">
        {Array.from({ length: 14 }, (_, i) => (
          <Chip key={i} value={`r${i + 1}`} badge={{ count: i + 1, label: `${i + 1} students` }}>
            {`Room ${i + 1}`}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  ),
};

/** Long chip labels truncate inside their row. */
export const LongLabels: Story = {
  args: { label: 'Filter people', defaultValue: 'a' },
  render: (args) => (
    <ChipGroup {...args}>
      <Chip value="a" badge={{ count: 2, label: '2 people' }}>
        Students who have not spoken since the break
      </Chip>
      <Chip value="b">Everyone who asked a question in chat</Chip>
    </ChipGroup>
  ),
};

/** A disabled group keeps its checked chip visible. */
export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <ChipGroup {...args}>
      <Chip value="all" badge={{ count: 14, label: '14 people' }}>
        All
      </Chip>
      <Chip value="hands" badge={{ count: 4, label: '4 people' }}>
        Raised hands
      </Chip>
    </ChipGroup>
  ),
};

/** On the stage: the inverted chip becomes white on dark. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <ChipGroup {...args}>
      <Chip value="all" badge={{ count: 14, label: '14 people' }}>
        All
      </Chip>
      <Chip value="hands" badge={{ count: 4, label: '4 people' }}>
        Raised hands
      </Chip>
      <Chip value="low" badge={{ count: 3, label: '3 people' }}>
        Low engagement
      </Chip>
    </ChipGroup>
  ),
};
