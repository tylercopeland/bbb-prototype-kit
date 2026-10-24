import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './Switch';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: {
    children: 'Record breakout rooms',
    defaultSelected: false,
    isDisabled: false,
  },
  decorators: [
    (Story) => (
      <div className="w-80 rounded-panel bg-surface px-4 text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One option row, off. */
export const Off: Story = {};

/** On: the track turns accent and the thumb moves to the end. */
export const On: Story = {
  args: { defaultSelected: true },
};

/** A second line under the label. */
export const WithDescription: Story = {
  args: { description: 'Rooms are recorded together with the main session.' },
};

/** The breakout options (Breakout.dc.html 490): four rows, one list. */
export const OptionRows: Story = {
  render: (args) => (
    <div className="flex flex-col">
      <Switch {...args} defaultSelected>
        Send my current slide to every room
      </Switch>
      <Switch {...args} defaultSelected>
        Students can come back on their own
      </Switch>
      <Switch {...args}>Bring everyone back when time is up</Switch>
      <Switch {...args}>Record breakout rooms</Switch>
    </div>
  ),
};

/** A long label wraps; the switch keeps its size. */
export const LongLabel: Story = {
  args: {
    children:
      'Let students who finish early move themselves to another room without asking the teacher first',
  },
};

/** Disabled rows, off and on. */
export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-col">
      <Switch {...args} isDisabled>
        Record breakout rooms
      </Switch>
      <Switch {...args} isDisabled defaultSelected>
        Students can come back on their own
      </Switch>
    </div>
  ),
};

/** Autofocused: the ring on the track, not the row. */
export const Focused: Story = {
  args: { autoFocus: true, defaultSelected: true },
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
  render: (args) => (
    <div className="flex flex-col">
      <Switch {...args}>Record breakout rooms</Switch>
      <Switch {...args} defaultSelected>
        Students can come back on their own
      </Switch>
    </div>
  ),
};
