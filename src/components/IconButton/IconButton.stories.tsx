import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: {
    label: 'Close',
    icon: 'close',
    variant: 'ghost',
    tone: 'neutral',
    size: 'md',
    isDisabled: false,
  },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'soft', 'ghost'] },
    tone: { control: 'radio', options: ['neutral', 'danger'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg', 'touch'] },
    icon: { control: 'select' },
    shortcut: { control: 'select', options: [undefined, 'microphone', 'camera', 'raiseHand'] },
    tooltipPlacement: { control: 'radio', options: ['top', 'bottom', 'start', 'end'] },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 flex-wrap items-center gap-4 p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Panel header buttons: close, mute everyone, more. Transparent, `text-icon`. The default. */
export const Ghost: Story = {
  render: (args) => (
    <>
      <IconButton {...args} />
      <IconButton {...args} label="Mute everyone" icon="microphoneOff" />
      <IconButton {...args} label="More people options" icon="more" />
    </>
  ),
};

/** Row actions and the action bar: the light fill. */
export const Soft: Story = {
  args: { variant: 'soft' },
  render: (args) => (
    <>
      <IconButton {...args} label="Message Anton Georgiev privately" icon="chat" size="sm" />
      <IconButton {...args} label="More actions for Anton Georgiev" icon="moreVertical" size="sm" />
      <IconButton {...args} label="People" icon="people" size="touch" />
    </>
  ),
};

export const Primary: Story = {
  args: { variant: 'primary', label: 'Share media', icon: 'shareMedia' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', label: 'Settings', icon: 'settings' },
};

/** Leave: one size and one radius everywhere (X2), the soft danger tint. */
export const Danger: Story = {
  args: { variant: 'soft', tone: 'danger', size: 'touch', label: 'Leave session', icon: 'leave' },
};

/** 32 / 36 / 40 / 44px squares; the three smaller ones keep a 44px touch target (X14). */
export const Sizes: Story = {
  args: { variant: 'soft', label: 'Settings', icon: 'settings' },
  render: (args) => (
    <>
      {(['sm', 'md', 'lg', 'touch'] as const).map((size) => (
        <IconButton key={size} {...args} size={size} label={`Settings (${size})`} />
      ))}
    </>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <>
      <IconButton {...args} variant="primary" label="Share media" icon="shareMedia" />
      <IconButton {...args} variant="secondary" label="Settings" icon="settings" />
      <IconButton {...args} variant="soft" label="People" icon="people" />
      <IconButton {...args} variant="ghost" label="Close" icon="close" />
      <IconButton {...args} variant="soft" tone="danger" label="Leave session" icon="leave" />
    </>
  ),
};

/**
 * The tooltip repeats the name with its key chip, and the button carries
 * `aria-keyshortcuts`. Autofocused so the tooltip is open for review and axe.
 */
export const WithShortcut: Story = {
  tags: ['wait-for-tooltip'],
  args: {
    variant: 'soft',
    size: 'touch',
    label: 'Raise hand',
    icon: 'raiseHand',
    shortcut: 'raiseHand',
    autoFocus: true,
  },
};

/** The four panel buttons and Leave, as the Focus board draws the action bar (lines 45–62). */
export const ActionBarOnStage: Story = {
  globals: { surface: 'stage' },
  args: { variant: 'soft', size: 'touch' },
  render: (args) => (
    <div className="flex items-center gap-2">
      <IconButton {...args} label="People" icon="people" />
      <IconButton {...args} label="Chat" icon="chat" />
      <IconButton {...args} label="Shared notes" icon="notes" />
      <IconButton {...args} label="Plugins" icon="plugins" />
      <IconButton {...args} tone="danger" label="Leave session" icon="leave" />
    </div>
  ),
};
