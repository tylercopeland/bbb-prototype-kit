import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Upload a file',
    variant: 'secondary',
    tone: 'neutral',
    size: 'md',
    isDisabled: false,
  },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'soft', 'ghost'] },
    tone: { control: 'radio', options: ['neutral', 'danger'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg', 'touch'] },
    icon: { control: 'select' },
    iconEnd: { control: 'select' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Start sharing, Open N rooms, Done. */
export const Primary: Story = {
  args: { variant: 'primary', children: 'Start sharing' },
};

/** Upload a file, Export, Keep rooms open, Cancel. The default. */
export const Secondary: Story = {};

/** Join, Show on stage, Return to main room. */
export const Soft: Story = {
  args: { variant: 'soft', children: 'Join' },
};

/** Show 18 more, See all rooms' work. */
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Show 18 more' },
};

/** Stop sharing: the primary fill in red. Every variant takes `tone="danger"`. */
export const Danger: Story = {
  args: { variant: 'primary', tone: 'danger', children: 'Stop sharing' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} />
      <Button {...args} variant="secondary">
        Close all rooms
      </Button>
      <Button {...args} variant="soft">
        Leave session
      </Button>
      <Button {...args} variant="ghost">
        Remove from session
      </Button>
    </div>
  ),
};

/** Close all rooms, End all rooms: white with a red border and red text. */
export const DangerSecondary: Story = {
  args: { variant: 'secondary', tone: 'danger', children: 'Close all rooms' },
};

/** 32 / 36 / 40 / 44px. Sizes under 44px keep a 44px touch target through `hit-area`. */
export const Sizes: Story = {
  args: { variant: 'primary', children: 'Start sharing' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {(['sm', 'md', 'lg', 'touch'] as const).map((size) => (
        <Button key={size} {...args} size={size}>
          {args.children} · {size}
        </Button>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  args: { variant: 'primary', icon: 'shareMedia', children: 'Start sharing' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} />
      <Button {...args} variant="secondary" icon={undefined} iconEnd="externalLink">
        Open analytics
      </Button>
      <Button {...args} variant="ghost" icon="people" size="sm">
        Show 18 more
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} variant="primary">
        Start sharing
      </Button>
      <Button {...args} variant="secondary">
        Upload a file
      </Button>
      <Button {...args} variant="soft">
        Join
      </Button>
      <Button {...args} variant="ghost">
        Show 18 more
      </Button>
      <Button {...args} variant="primary" tone="danger">
        Stop sharing
      </Button>
      <Button {...args} variant="secondary" tone="danger">
        Close all rooms
      </Button>
    </div>
  ),
};

/** Every variant on the stage ramp. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} variant="primary">
        Start sharing
      </Button>
      <Button {...args} variant="secondary">
        Upload a file
      </Button>
      <Button {...args} variant="soft">
        Join
      </Button>
      <Button {...args} variant="ghost">
        Show 18 more
      </Button>
      <Button {...args} variant="primary" tone="danger">
        Stop sharing
      </Button>
      <Button {...args} variant="soft" tone="danger">
        Leave session
      </Button>
    </div>
  ),
};
