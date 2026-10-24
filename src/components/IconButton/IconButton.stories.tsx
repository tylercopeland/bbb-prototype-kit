import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleButton } from '../ToggleButton';
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

/** Panel header buttons: close, settings, more. Transparent, `text-icon`. The default. */
export const Ghost: Story = {
  render: (args) => (
    <>
      <IconButton {...args} />
      <IconButton {...args} label="Settings" icon="settings" />
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
      <IconButton {...args} label="More actions for Anton Georgiev" icon="more" size="sm" />
      <IconButton {...args} label="Share media" icon="shareMedia" size="touch" />
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

/** Disabled icon buttons stay focusable and hoverable, so the tooltip can still say what they are. */
export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <>
      <IconButton {...args} variant="primary" label="Share media" icon="shareMedia" />
      <IconButton {...args} variant="secondary" label="Settings" icon="settings" />
      <IconButton {...args} variant="soft" label="React" icon="react" />
      <IconButton {...args} variant="ghost" label="Close" icon="close" />
      <IconButton {...args} variant="soft" tone="danger" label="Leave session" icon="leave" />
    </>
  ),
};

/**
 * The tooltip shows the name with its key chip, the button carries
 * `aria-keyshortcuts`, and assistive technology hears the shortcut as the
 * description. Join audio sits in the mic slot before audio is joined and
 * shares the microphone key. Autofocused so the tooltip is open for review and axe.
 */
export const WithShortcut: Story = {
  tags: ['wait-for-tooltip'],
  args: {
    variant: 'soft',
    size: 'touch',
    label: 'Join audio',
    icon: 'audioNotJoined',
    shortcut: 'microphone',
    autoFocus: true,
  },
};

/** The ghost default on the stage. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  render: (args) => (
    <>
      <IconButton {...args} />
      <IconButton {...args} variant="soft" label="Share media" icon="shareMedia" size="touch" />
      <IconButton {...args} variant="soft" tone="danger" label="Leave session" icon="leave" size="touch" />
    </>
  ),
};

/**
 * The panel buttons and Leave, as the Focus board draws the action bar
 * (lines 45–62, 850–858). People, Chat, Notes and Plugins are toggles
 * (`aria-pressed`) with People selected; Leave is the soft danger IconButton.
 * Count badges come in milestone 3.
 */
export const ActionBarOnStage: Story = {
  globals: { surface: 'stage' },
  args: { variant: 'soft', size: 'touch' },
  render: (args) => (
    <div className="flex items-center gap-2">
      <ToggleButton label="People" icon="people" defaultSelected />
      <ToggleButton label="Chat" icon="chat" />
      <ToggleButton label="Shared notes" icon="notes" />
      <ToggleButton label="Plugins" icon="plugins" />
      <IconButton {...args} tone="danger" label="Leave session" icon="leave" />
    </div>
  ),
};
