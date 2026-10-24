import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { ConfirmDialog, Dialog } from './Dialog';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  args: {
    title: 'Closing rooms',
    kicker: 'Wrapping up',
    kickerTone: 'hand',
    description:
      'Students see a countdown so they can finish their thought. Boards, notes and room chat are saved to Shared notes automatically.',
    trigger: <Button>Close all rooms</Button>,
    // Both actions close the dialog, as the real ones will after acting.
    footer: ({ close }) => (
      <>
        <Button onPress={close}>Keep rooms open</Button>
        <Button variant="primary" onPress={close}>
          Bring everyone back now
        </Button>
      </>
    ),
  },
  argTypes: {
    trigger: { control: false },
    children: { control: false },
    footer: { control: false },
    kickerTone: { control: 'radio', options: ['neutral', 'hand', 'danger'] },
    role: { control: 'radio', options: ['dialog', 'alertdialog'] },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The "Closing rooms" dialog (Breakout.dc.html 326), closed. Press the trigger. */
export const Default: Story = {};

/** Open by default, so axe scans the dialog, its heading, description and close button. */
export const Open: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true },
};

/**
 * Leave needs a confirmation (D5): an alertdialog, Cancel focused first,
 * the destructive action in the danger tone.
 */
export const ConfirmLeave: Story = {
  tags: ['wait-for-overlay'],
  render: () => (
    <ConfirmDialog
      defaultOpen
      title="Leave the session?"
      description="You can rejoin from the same link while the session is running."
      confirmLabel="Leave session"
      tone="danger"
      onConfirm={() => {}}
      trigger={<IconButton label="Leave session" icon="leave" variant="soft" tone="danger" size="touch" />}
    />
  ),
};

/** Remove from session, from the student actions menu. */
export const ConfirmRemove: Story = {
  tags: ['wait-for-overlay'],
  render: () => (
    <ConfirmDialog
      defaultOpen
      title="Remove Anton Georgiev from the session?"
      description="Anton can rejoin with the session link unless you also lock the room."
      confirmLabel="Remove"
      tone="danger"
      onConfirm={() => {}}
      trigger={<Button tone="danger">Remove from session</Button>}
    />
  ),
};

/** Opening rooms is confirmed too (B5), with a neutral primary action. */
export const ConfirmOpenRooms: Story = {
  tags: ['wait-for-overlay'],
  render: () => (
    <ConfirmDialog
      defaultOpen
      title="Open 4 rooms?"
      description="Students move to their rooms now. You can bring everyone back at any time."
      confirmLabel="Open 4 rooms"
      onConfirm={() => {}}
      trigger={<Button variant="primary">Open rooms</Button>}
    />
  ),
};

/** A dialog driven from state, with no trigger: the routes open these from the URL. */
export const WithoutTrigger: Story = {
  tags: ['wait-for-overlay'],
  args: {
    trigger: undefined,
    isOpen: true,
    kicker: undefined,
    title: 'Reconnecting…',
    description: 'Your connection dropped. We are trying to reconnect you to the session.',
    footer: ({ close }) => <Button onPress={close}>Leave session</Button>,
  },
};

/** Opened over the stage. */
export const OpenOnStage: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true },
  globals: { surface: 'stage' },
};

/** The closed trigger on the stage. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  args: {
    trigger: <IconButton label="Leave session" icon="leave" variant="soft" tone="danger" size="touch" />,
  },
};
