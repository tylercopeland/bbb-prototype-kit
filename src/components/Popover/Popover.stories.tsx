import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, type IconName } from '../../icons';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Popover } from './Popover';

/** The three featured plugins of Focus.dc.html 213–219, as secondary buttons stacked icon over label. */
function Featured({ items }: { items: Array<{ label: string; icon: IconName }> }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <Button key={item.label} className="h-24 flex-col gap-2 rounded-lg">
          <Icon name={item.icon} size="md" className="text-icon" />
          {item.label}
        </Button>
      ))}
    </div>
  );
}

/** The "More plugins" rows (Focus.dc.html 221–229): ghost buttons with a subtitle. */
function MorePlugins({ items }: { items: Array<{ label: string; sub: string }> }) {
  return (
    <>
      <p className="px-1 text-2xs font-bold tracking-label text-text-muted uppercase">More plugins</p>
      <div className="flex flex-col">
        {items.map((item) => (
          <Button key={item.label} variant="ghost" className="h-control-touch justify-start px-2 text-text">
            <span className="flex flex-col items-start text-left">
              <span>{item.label}</span>
              <span className="text-xs font-regular text-text-muted">{item.sub}</span>
            </span>
          </Button>
        ))}
      </div>
    </>
  );
}

const pluginsContent = (
  <>
    <Featured
      items={[
        { label: 'Breakout rooms', icon: 'breakouts' },
        { label: 'Poll', icon: 'poll' },
        { label: 'Timer', icon: 'timer' },
      ]}
    />
    <MorePlugins
      items={[
        { label: 'Q&A board', sub: 'Collect and upvote questions' },
        { label: 'Quiz', sub: 'Quick graded questions' },
        { label: 'Word cloud', sub: 'Gather one-word answers' },
        { label: 'Random picker', sub: 'Pick a person or a group' },
      ]}
    />
  </>
);

const meta = {
  title: 'Components/Popover',
  component: Popover,
  args: {
    title: 'Plugins',
    trigger: <IconButton label="Plugins" icon="plugins" variant="soft" size="touch" />,
    children: pluginsContent,
    placement: 'top',
  },
  argTypes: {
    trigger: { control: false },
    children: { control: false },
    placement: { control: 'radio', options: ['top', 'bottom', 'start', 'end'] },
  },
  decorators: [
    // Tall enough for the whole Plugins picker above its trigger: when the
    // card has to scroll, axe measures the clipped rows against the page
    // behind the card, and over the stage that reads as a contrast failure.
    (Story) => (
      <div className="flex min-h-128 items-end justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Plugins picker (Focus.dc.html 211), closed. Press the trigger. */
export const Default: Story = {};

/** Open by default, so axe scans the dialog, its heading and the close button. */
export const Open: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true },
};

/**
 * The Share media picker (Focus.dc.html 322) has no visible title: the
 * name is for assistive technology and only the close button is drawn. It
 * is wider than the default, through `className`.
 */
export const TitleHidden: Story = {
  tags: ['wait-for-overlay'],
  args: {
    title: 'Share media',
    titleHidden: true,
    defaultOpen: true,
    className: 'w-112',
    trigger: <IconButton label="Share media" icon="shareMedia" variant="soft" size="touch" />,
    children: (
      <div className="grid grid-cols-2 gap-2">
        <Button className="h-24 flex-col gap-2 rounded-lg">Add slides</Button>
        <Button className="h-24 flex-col gap-2 rounded-lg">Share your screen</Button>
        <Button className="h-24 flex-col gap-2 rounded-lg">Play a video</Button>
        <Button className="h-24 flex-col gap-2 rounded-lg">Share a link</Button>
      </div>
    ),
  },
};

/** Opened from the action bar on the stage: the card keeps the panel colors and the stage tokens. */
export const OpenOnStage: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true },
  globals: { surface: 'stage' },
};

/** The closed trigger on the stage. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};

export const Placements: Story = {
  tags: ['wait-for-overlay'],
  decorators: [
    (Story) => (
      <div className="flex min-h-96 items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <div className="grid grid-cols-2 gap-32">
      {(['top', 'bottom', 'start', 'end'] as const).map((placement) => (
        <Popover
          key={placement}
          {...args}
          title={placement}
          placement={placement}
          defaultOpen
          className="w-48"
          trigger={<IconButton label={placement} icon="plugins" variant="soft" size="touch" />}
        >
          <Button>Action</Button>
        </Popover>
      ))}
    </div>
  ),
};
