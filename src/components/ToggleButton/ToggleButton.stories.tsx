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
    tone: 'neutral',
    isSpeaking: false,
    isDisabled: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg', 'touch'] },
    tone: { control: 'radio', options: ['neutral', 'hand'] },
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

/** Live: the selected pair. The name is still "Microphone"; only `aria-pressed` changed (X7). */
export const MicrophoneOn: Story = {
  args: { defaultSelected: true },
};

/** Live and speaking: the green ring, which appears only while sound comes through. */
export const MicrophoneSpeaking: Story = {
  args: { defaultSelected: true, isSpeaking: true },
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

/** `tone="hand"`: the selected state is amber, with the same glyph. */
export const RaiseHand: Story = {
  args: {
    label: 'Raise hand',
    icon: 'raiseHand',
    selectedIcon: undefined,
    shortcut: 'raiseHand',
    tone: 'hand',
  },
  render: (args) => (
    <>
      <ToggleButton {...args} defaultSelected={false} />
      <ToggleButton {...args} defaultSelected />
    </>
  ),
};

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
        tone="hand"
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

/** Mic, Camera, Share media, React and Raise hand, as the Focus board draws them (lines 54–56, 801–810). */
export const ActionBarOnStage: Story = {
  globals: { surface: 'stage' },
  render: (args) => (
    <div className="flex items-center gap-2">
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
        tone="hand"
        defaultSelected={false}
      />
    </div>
  ),
};
