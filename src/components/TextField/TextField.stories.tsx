import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  args: {
    label: 'Room name',
    labelHidden: false,
    placeholder: 'Group A',
    size: 'lg',
    isDisabled: false,
    isInvalid: false,
    isReadOnly: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['md', 'lg', 'touch'] },
  },
  decorators: [
    (Story) => (
      <div className="w-80 rounded-panel bg-surface p-4 text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A visible label above the input (B8: a real input). */
export const Default: Story = {};

/** The label stays for assistive technology; the placeholder is only a hint. */
export const HiddenLabel: Story = {
  args: { label: 'Message everyone', labelHidden: true, placeholder: 'Message everyone' },
};

export const WithDescription: Story = {
  args: { description: 'Students see this name on their room card.' },
};

/** The error line while invalid: danger text with the error glyph, linked to the field. */
export const Invalid: Story = {
  args: { isInvalid: true, errorMessage: 'Enter a room name.', defaultValue: '' },
};

/** 36 / 40 / 44px. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['md', 'lg', 'touch'] as const).map((size) => (
        <TextField key={size} {...args} size={size} label={`Room name · ${size}`} />
      ))}
    </div>
  ),
};

/** A long value scrolls inside the input; a long label wraps. */
export const LongContent: Story = {
  args: {
    label: 'The name students see on their room card and in the breakout panel',
    defaultValue: 'Cross-disciplinary project group for the renewable energy debate, second cohort',
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'Group A' },
};

export const ReadOnly: Story = {
  args: { isReadOnly: true, defaultValue: 'Group A' },
};

/** Autofocused: the ring on the input (D2). */
export const Focused: Story = {
  args: { autoFocus: true },
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
    <div className="flex flex-col gap-4">
      <TextField {...args} />
      <TextField {...args} isInvalid errorMessage="Enter a room name." />
    </div>
  ),
};
