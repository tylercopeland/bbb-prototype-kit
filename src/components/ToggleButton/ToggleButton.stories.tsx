import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from '../IconButton';
import { ToggleButton } from './ToggleButton';

const meta = {
  title: 'Components/ToggleButton',
  component: ToggleButton,
  args: {
    label: 'Microphone',
    icon: 'microphoneOff',
    selectedIcon: 'microphone',
    shortcut: 'microphone',
    size: 'touch',
    selectedTone: 'accent',
    isSpeaking: false,
    isDisabled: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg', 'touch'] },
    selectedTone: { control: 'radio', options: ['accent', 'hand'] },
    icon: { control: 'select' },
    selectedIcon: { control: 'select' },
    shortcut: { control: 'select', options: [undefined, 'microphone', 'camera', 'raiseHand'] },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 flex-wrap items-center gap-4 p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Muted: the neutral fill. Red is reserved for Leave and errors. */
export const MicrophoneOff: Story = {
  args: { defaultSelected: false },
};

/**
 * Live: the selected pair plus the inset ring, so selected never rests on
 * color alone. The name is still "Microphone"; only `aria-pressed` changed (X7).
 */
export const MicrophoneOn: Story = {
  args: { defaultSelected: true },
};

/**
 * Live and speaking: the green ring and the speaking glyph, and a hidden
 * "Speaking" description. Green appears only while sound comes through.
 */
export const MicrophoneSpeaking: Story = {
  args: { defaultSelected: true, isSpeaking: true },
};

/** Speaking with keyboard focus: the green ring stays inside, the focus ring sits outside it. */
export const SpeakingAndFocused: Story = {
  tags: ['wait-for-tooltip'],
  args: { defaultSelected: true, isSpeaking: true, autoFocus: true },
};

export const CameraOff: Story = {
  args: {
    label: 'Camera',
    icon: 'cameraOff',
    selectedIcon: 'camera',
    shortcut: 'camera',
    defaultSelected: false,
  },
};

export const CameraOn: Story = {
  args: {
    label: 'Camera',
    icon: 'cameraOff',
    selectedIcon: 'camera',
    shortcut: 'camera',
    defaultSelected: true,
  },
};

/** `selectedTone="hand"`: the selected state is amber, with the same glyph and the inset ring. */
export const RaiseHand: Story = {
  args: {
    label: 'Raise hand',
    icon: 'raiseHand',
    selectedIcon: undefined,
    shortcut: 'raiseHand',
    selectedTone: 'hand',
  },
  render: (args) => (
    <>
      <ToggleButton {...args} defaultSelected={false} />
      <ToggleButton {...args} defaultSelected />
    </>
  ),
};

/** Disabled toggles stay focusable and keep their tooltip; the selected one keeps its fill and ring. */
export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <>
      <ToggleButton {...args} defaultSelected={false} />
      <ToggleButton {...args} defaultSelected />
      <ToggleButton
        {...args}
        label="Raise hand"
        icon="raiseHand"
        selectedIcon={undefined}
        selectedTone="hand"
        defaultSelected
      />
    </>
  ),
};

/** The action bar uses `touch`; the smaller sizes are for dense chrome. */
export const Sizes: Story = {
  render: (args) => (
    <>
      {(['sm', 'md', 'lg', 'touch'] as const).map((size) => (
        <ToggleButton key={size} {...args} size={size} defaultSelected={size === 'touch'} />
      ))}
    </>
  ),
};

/** The three states on the stage. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  render: (args) => (
    <>
      <ToggleButton {...args} defaultSelected={false} />
      <ToggleButton {...args} defaultSelected />
      <ToggleButton {...args} defaultSelected isSpeaking />
    </>
  ),
};

/**
 * The whole action bar as the Focus board draws it (lines 45–62, 801–858):
 * the panel toggles (People selected), then Mic, Camera, Share media, React,
 * Raise hand, then Leave. Count badges arrive in milestone 3.
 */
export const ActionBarOnStage: Story = {
  globals: { surface: 'stage' },
  render: (args) => (
    <div className="flex items-center gap-2">
      <ToggleButton
        {...args}
        label="People"
        icon="people"
        selectedIcon={undefined}
        shortcut={undefined}
        defaultSelected
      />
      <ToggleButton {...args} label="Chat" icon="chat" selectedIcon={undefined} shortcut={undefined} />
      <ToggleButton
        {...args}
        label="Shared notes"
        icon="notes"
        selectedIcon={undefined}
        shortcut={undefined}
      />
      <ToggleButton {...args} label="Plugins" icon="plugins" selectedIcon={undefined} shortcut={undefined} />
      <span className="w-4" aria-hidden="true" />
      <ToggleButton {...args} defaultSelected isSpeaking />
      <ToggleButton
        {...args}
        label="Camera"
        icon="cameraOff"
        selectedIcon="camera"
        shortcut="camera"
        defaultSelected={false}
      />
      <IconButton label="Share media" icon="shareMedia" variant="soft" size="touch" />
      <IconButton label="React" icon="react" variant="soft" size="touch" />
      <ToggleButton
        {...args}
        label="Raise hand"
        icon="raiseHand"
        selectedIcon={undefined}
        shortcut="raiseHand"
        selectedTone="hand"
        defaultSelected={false}
      />
      <span className="w-4" aria-hidden="true" />
      <IconButton label="Leave session" icon="leave" variant="soft" tone="danger" size="touch" />
    </div>
  ),
};
