import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createRoom,
  selectRaisedHands,
  selectSelf,
  selectUnreadTotal,
  type AudioState,
  type Panel,
  type ParticipantFixture,
} from '../../mocks';
import { ActionBar } from './ActionBar';

const room = createRoom();
const me = selectSelf(room)!;

const meta = {
  title: 'Components/ActionBar',
  component: ActionBar,
  args: {
    panel: 'none',
    pluginsOpen: false,
    raisedHands: selectRaisedHands(room).length,
    unread: selectUnreadTotal(room),
    audio: me.audio,
    camera: me.camera,
    handRaised: me.handRaisedAt !== null,
    isSharing: false,
    onTogglePanel: () => {},
  },
  argTypes: {
    panel: { control: 'radio', options: ['none', 'people', 'chat', 'notes', 'poll'] },
    audio: { control: 'radio', options: ['notJoined', 'listening', 'muted', 'live', 'speaking'] },
    onTogglePanel: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-250 max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** F1: nothing open, the teacher live with the camera on, 4 hands and 2 unread as badges. */
export const Default: Story = {};

/** The People panel open: its button is pressed and its badge goes away (the list shows the hands). */
export const PeopleOpen: Story = {
  args: { panel: 'people' },
};

/** Before audio is joined, the mic slot is "Join audio" (same key), never a third toggle state. Joining starts muted. */
export const AudioNotJoined: Story = {
  args: { audio: 'notJoined' },
};

export const Speaking: Story = {
  args: { audio: 'speaking' },
};

export const HandRaised: Story = {
  args: { handRaised: true, camera: false },
};

/** The bar wired to local state, so every control works: the Leave button opens the confirmation. */
function Interactive(props: React.ComponentProps<typeof ActionBar>) {
  const [panel, setPanel] = useState<Panel>(props.panel);
  const [plugins, setPlugins] = useState(false);
  const [audio, setAudio] = useState<AudioState>(props.audio);
  const [camera, setCamera] = useState(props.camera);
  const [hand, setHand] = useState(props.handRaised);
  const [left, setLeft] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <ActionBar
        {...props}
        panel={panel}
        pluginsOpen={plugins}
        audio={audio}
        camera={camera}
        handRaised={hand}
        onTogglePanel={(p) => setPanel((current) => (current === p ? 'none' : p))}
        onTogglePlugins={() => setPlugins((v) => !v)}
        onJoinAudio={() => setAudio('muted')}
        onMicrophoneChange={(on) => setAudio(on ? 'live' : 'muted')}
        onCameraChange={setCamera}
        onRaiseHandChange={setHand}
        onLeave={() => setLeft(true)}
      />
      <p className="text-sm text-text-muted">{left ? 'Left the session' : `Panel: ${panel}`}</p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <Interactive {...args} />,
};

/** Counts from each fixture: none for a 1:1 call, the class, and thirty people. */
function FromFixture({ people }: { people: ParticipantFixture }) {
  const state = createRoom({ participants: people });
  const self = selectSelf(state)!;
  return (
    <ActionBar
      panel="none"
      raisedHands={selectRaisedHands(state).length}
      unread={selectUnreadTotal(state)}
      audio={self.audio}
      camera={self.camera}
      handRaised={self.handRaisedAt !== null}
      onTogglePanel={() => {}}
    />
  );
}

export const OneParticipant: Story = { render: () => <FromFixture people="one" /> };
export const ThirtyParticipants: Story = { render: () => <FromFixture people="thirty" /> };

/** On the stage, as in the room. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
