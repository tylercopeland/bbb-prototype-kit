import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from 'react-aria-components';
import { Tooltip } from './Tooltip';

/** A plain trigger for these stories; IconButton builds the real one. */
function Trigger({ label }: { label: string }) {
  return (
    <Button
      aria-label={label}
      className="hit-area flex size-control-touch items-center justify-center rounded-control bg-surface-raised text-md font-semibold text-text focus-ring"
    >
      {label.slice(0, 1)}
    </Button>
  );
}

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: {
    label: 'Microphone',
    children: <Trigger label="Microphone" />,
  },
  argTypes: {
    children: { control: false },
    placement: { control: 'radio', options: ['top', 'bottom', 'start', 'end'] },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover or focus the control. */
export const Default: Story = {};

export const WithShortcut: Story = {
  args: { shortcut: 'microphone' },
};

/** Open by default so axe scans the tooltip itself. */
export const Open: Story = {
  args: { shortcut: 'microphone', defaultOpen: true },
};

/** Inverted on the stage: white with dark text. */
export const OpenOnStage: Story = {
  args: { shortcut: 'microphone', defaultOpen: true },
  globals: { surface: 'stage' },
};

export const LongLabel: Story = {
  args: {
    label: 'Share media: slides, a video, your screen, audio or a link',
    children: <Trigger label="Share media" />,
    defaultOpen: true,
  },
};

export const Placements: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-16 p-16">
      {(['top', 'bottom', 'start', 'end'] as const).map((placement) => (
        <Tooltip key={placement} {...args} label={placement} placement={placement} defaultOpen>
          <Trigger label={placement} />
        </Tooltip>
      ))}
    </div>
  ),
};
