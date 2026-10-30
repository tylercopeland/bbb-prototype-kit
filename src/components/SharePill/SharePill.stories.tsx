import type { Meta, StoryObj } from '@storybook/react-vite';
import { SharePill } from './SharePill';

const meta = {
  title: 'Components/SharePill',
  component: SharePill,
  args: {
    showing: 'screen',
    kind: 'Entire screen',
  },
  argTypes: {
    showing: { control: 'radio', options: ['screen', 'slides'] },
    kind: { control: 'radio', options: ['Entire screen', 'A window', 'A browser tab'] },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-24 items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SharePill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** M1: the screen is on stage. */
export const Screen: Story = {};

/** M2: the slides are back on stage while the screen stays shared. */
export const Slides: Story = {
  args: { showing: 'slides', kind: 'A window' },
};

/** The three screen kinds. */
export const Kinds: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      {(['Entire screen', 'A window', 'A browser tab'] as const).map((kind) => (
        <SharePill key={kind} {...args} kind={kind} />
      ))}
    </div>
  ),
};

/** Narrow: the note truncates, Stop sharing stays whole. */
export const Narrow: Story = {
  args: { showing: 'slides' },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

/** In the stage's chrome row (Focus.dc.html 72): the dark pill. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
