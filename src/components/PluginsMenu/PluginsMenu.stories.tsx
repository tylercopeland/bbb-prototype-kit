import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, defaultPlugins, selectPluginSubtitles } from '../../mocks';
import { IconButton } from '../IconButton';
import { Popover } from '../Popover';
import { PluginsMenu } from './PluginsMenu';

const room = createRoom();

const meta = {
  title: 'Components/PluginsMenu',
  component: PluginsMenu,
  args: {
    featured: defaultPlugins.featured,
    more: defaultPlugins.more,
    subtitles: selectPluginSubtitles(room),
  },
  argTypes: {
    featured: { control: false },
    more: { control: false },
  },
  decorators: [
    // The card the action bar's Popover draws around the content.
    (Story) => (
      <div className="flex min-h-96 items-end justify-center p-8">
        <div className="w-panel max-w-full rounded-xl border border-border bg-surface p-3 text-text shadow-overlay">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof PluginsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** BO1: the three featured cards with their state, then the four more plugins. */
export const Default: Story = {};

/** No extra plugins installed. */
export const NoMorePlugins: Story = {
  args: { more: [] },
};

/** Only the list, with a long label. */
export const LongLabels: Story = {
  args: {
    featured: [],
    more: [
      ...defaultPlugins.more,
      {
        id: 'attendance',
        label: 'Attendance register with a very long name that truncates',
        description: 'Marks who was here, when they joined and when they left the session',
      },
    ],
  },
};

/** As the action bar shows it: inside the Plugins popover with its title and close button. */
export const InPopover: Story = {
  tags: ['wait-for-overlay'],
  decorators: [
    (Story) => (
      <div className="flex min-h-128 items-end justify-center p-8">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Popover
      title="Plugins"
      defaultOpen
      trigger={<IconButton label="Plugins" icon="plugins" variant="soft" size="touch" />}
    >
      <PluginsMenu {...args} />
    </Popover>
  ),
};

/** Opened from the action bar on the stage: the popover stays a white panel. */
export const Stage: Story = {
  ...InPopover,
  globals: { surface: 'stage' },
};
