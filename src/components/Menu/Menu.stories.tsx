import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Selection } from 'react-aria-components';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Menu, MenuItem, MenuSection, MenuSeparator, Submenu } from './Menu';

/**
 * The student actions menu (docs/screenshots/O2StudentActions.png):
 * two actions, the four switches as checkbox items (X9), all off as on the
 * canvas (the student is muted), "Move to…" as a submenu (B2) and Remove in
 * the danger tone. The switches hold their state here; in the room they
 * come from the store.
 */
function StudentActions(props: Partial<React.ComponentProps<typeof Menu>>) {
  const [flags, setFlags] = useState<Selection>(new Set());
  return (
    <Menu
      trigger={<IconButton label="More actions for Anton Georgiev" icon="more" variant="soft" size="sm" />}
      header={
        <>
          <Avatar name="Anton Georgiev" size="lg" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-md font-bold">Anton Georgiev</span>
            <span className="truncate text-xs text-text-muted">Muted · Camera on</span>
          </span>
        </>
      }
      {...props}
    >
      <MenuItem id="presenter" icon="presenter">
        Make presenter
      </MenuItem>
      <MenuItem id="camera" icon="cameraOff">
        Turn off camera
      </MenuItem>
      <MenuSeparator />
      <MenuSection selectionMode="multiple" selectedKeys={flags} onSelectionChange={setFlags}>
        <MenuItem id="microphone" icon="microphone" description="Ask to unmute">
          Microphone
        </MenuItem>
        <MenuItem id="whiteboard" icon="whiteboardAccess">
          Whiteboard access
        </MenuItem>
        <MenuItem id="moderator" icon="moderator">
          Moderator
        </MenuItem>
        <MenuItem id="lock" icon="lockChat">
          Lock public chat
        </MenuItem>
      </MenuSection>
      <MenuSeparator />
      <Submenu label="Move to…" icon="breakouts">
        <MenuItem id="main">Main room</MenuItem>
        {[1, 2, 3, 4].map((n) => (
          <MenuItem key={n} id={`room-${n}`}>
            {`Room ${n}`}
          </MenuItem>
        ))}
      </Submenu>
      <MenuItem id="remove" icon="removeFromSession" tone="danger">
        Remove from session
      </MenuItem>
    </Menu>
  );
}

const meta = {
  title: 'Components/Menu',
  component: Menu,
  render: (args) => <StudentActions {...args} />,
  args: {
    // StudentActions supplies the trigger and the items; these satisfy the required props.
    trigger: <IconButton label="More actions for Anton Georgiev" icon="more" variant="soft" size="sm" />,
    children: <MenuItem id="presenter">Make presenter</MenuItem>,
    placement: 'bottom end',
  },
  argTypes: {
    trigger: { control: false },
    children: { control: false },
    header: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-start justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The student actions menu, closed. Press the ⋯ button, or focus it and press ArrowDown. */
export const Default: Story = {};

/** Open by default, so axe scans the menu, the checkbox items and the submenu row. */
export const Open: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true },
};

/** Sections with headings, and a text Button as the trigger (the More menu of the session header). */
export const Sections: Story = {
  tags: ['wait-for-overlay'],
  render: (args) => (
    <Menu {...args} defaultOpen trigger={<Button icon="more">More</Button>}>
      <MenuSection title="Share and present">
        <MenuItem id="media" icon="shareMedia">
          Share media
        </MenuItem>
        <MenuItem id="notes" icon="notes">
          Shared notes
        </MenuItem>
        <MenuItem id="captions" icon="captions">
          Captions
        </MenuItem>
      </MenuSection>
      <MenuSection title="Session">
        <MenuItem id="recording" icon="recording">
          Recording
        </MenuItem>
        <MenuItem id="shortcuts" icon="shortcuts">
          Keyboard shortcuts
        </MenuItem>
        <MenuItem id="settings" icon="settings">
          Room settings
        </MenuItem>
      </MenuSection>
    </Menu>
  ),
};

/** Long labels truncate; the item keeps its full text as the accessible name. */
export const LongLabels: Story = {
  tags: ['wait-for-overlay'],
  render: (args) => (
    <Menu {...args} defaultOpen trigger={<IconButton label="More actions" icon="more" />}>
      <MenuItem id="a" icon="presenter" description="Hands the slides and the whiteboard to this person">
        Make presenter and hand over the whiteboard for the rest of the session
      </MenuItem>
      <MenuItem id="b" icon="cameraOff" isDisabled>
        Turn off camera (camera is already off)
      </MenuItem>
    </Menu>
  ),
};

/** Opened from a People row on the stage. */
export const OpenOnStage: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true },
  globals: { surface: 'stage' },
};

/** The closed trigger on the stage. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
