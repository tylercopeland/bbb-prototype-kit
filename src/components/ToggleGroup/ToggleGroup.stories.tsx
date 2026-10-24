import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleButton } from '../ToggleButton';
import { ToggleGroup } from './ToggleGroup';

const tools = (
  <>
    <ToggleButton id="select" label="Select" icon="select" size="md" />
    <ToggleButton id="pen" label="Pen" icon="annotate" size="md" />
    <ToggleButton id="text" label="Text" icon="text" size="md" />
    <ToggleButton id="shapes" label="Shapes" icon="shapes" size="md" />
    <ToggleButton id="eraser" label="Eraser" icon="eraser" size="md" />
  </>
);

const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  args: {
    label: 'Whiteboard tools',
    children: tools,
    selectionMode: 'single',
    orientation: 'horizontal',
    defaultSelectedKeys: ['pen'],
    isDisabled: false,
    disallowEmptySelection: false,
  },
  argTypes: {
    children: { control: false },
    selectionMode: { control: 'radio', options: ['single', 'multiple'] },
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
  },
  decorators: [
    (Story) => (
      <div className="flex items-start gap-4 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The whiteboard tools (Focus.dc.html 117–125): one tool at a time, so the group is a radio group. */
export const Single: Story = {};

/** `disallowEmptySelection`: a tool stays selected; pressing it again does nothing. */
export const AlwaysOneSelected: Story = {
  args: { disallowEmptySelection: true },
};

/** Several pressed at once: a toolbar of `aria-pressed` buttons. */
export const Multiple: Story = {
  args: { selectionMode: 'multiple', defaultSelectedKeys: ['pen', 'shapes'] },
};

/** Nothing selected yet. */
export const NoneSelected: Story = {
  args: { defaultSelectedKeys: [] },
};

/** Stacked, for a side rail; the arrow keys move up and down. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
};

/** The group's buttons go disabled together. */
export const Disabled: Story = {
  args: { isDisabled: true },
};

/** In the floating toolbar card the group sits in (the card itself is milestone 5's WhiteboardToolbar). */
export const InCard: Story = {
  args: { className: 'rounded-lg border border-border bg-surface p-1 shadow-overlay' },
};

/** On the stage, where the whiteboard tools float over the slide. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  args: { className: 'rounded-lg border border-border bg-surface p-1 shadow-overlay' },
};
