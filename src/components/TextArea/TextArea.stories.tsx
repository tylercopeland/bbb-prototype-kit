import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  args: {
    label: 'Message everyone',
    labelHidden: true,
    placeholder: 'Message everyone',
    sendLabel: 'Send',
    isDisabled: false,
  },
  decorators: [
    (Story) => (
      <div className="w-80 rounded-panel bg-surface p-4 text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The chat composer (Focus.dc.html 494–498): Enter sends, Shift + Enter adds a line (P5). */
export const Composer: Story = {};

/** With text: Send is enabled. */
export const WithText: Story = {
  args: { defaultValue: 'Can everyone see the slide?' },
};

/** Several lines: the box grows to a cap, then scrolls. */
export const MultiLine: Story = {
  args: {
    defaultValue:
      'First line of a longer message.\nSecond line.\nThird line.\nFourth line.\nFifth line.\nSixth line.\nSeventh line.\nEighth line.\nNinth line.',
  },
};

/** A private thread (Focus.dc.html 474–478): the label names the person and the lock sits before the text. */
export const DirectMessage: Story = {
  args: { label: 'Message Rafaela privately', placeholder: 'Message Rafaela privately', icon: 'private' },
};

/** With a visible label and the key hint as its description. */
export const Labelled: Story = {
  args: { labelHidden: false, description: 'Enter sends · Shift + Enter adds a line' },
};

/** Autofocused: the box rings around the textarea, not the Send button (D2). */
export const Focused: Story = {
  args: { autoFocus: true, defaultValue: 'Typing…' },
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'Chat is locked' },
};

/** On the stage. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  args: { defaultValue: 'Can everyone see the slide?' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};
