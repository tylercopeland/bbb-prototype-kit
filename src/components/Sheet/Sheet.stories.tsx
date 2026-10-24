import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Sheet } from './Sheet';

/** The More sheet's rows (Mobile.dc.html 273): one ghost button per action, full width. */
function Rows({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col">
      {items.map((label) => (
        <Button key={label} variant="ghost" className="h-control-touch justify-start px-2 text-text">
          {label}
        </Button>
      ))}
    </div>
  );
}

const moreRows = (
  <>
    <p className="px-2 pb-2 text-2xs font-bold tracking-label text-text-muted uppercase">Share and present</p>
    <Rows items={['Share media', 'Shared notes', 'Captions', 'Breakout rooms', 'Poll', 'Timer']} />
    <p className="px-2 pt-4 pb-2 text-2xs font-bold tracking-label text-text-muted uppercase">Session</p>
    <Rows items={['Plugins', 'Learning analytics', 'Room settings']} />
  </>
);

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  args: {
    title: 'More',
    position: 'bottom',
    trigger: <IconButton label="More" icon="more" variant="soft" size="touch" />,
    children: moreRows,
  },
  argTypes: {
    trigger: { control: false },
    children: { control: false },
    footer: { control: false },
    headerExtra: { control: false },
    position: { control: 'radio', options: ['bottom', 'end'] },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The More sheet (Mobile.dc.html 273), closed. Press the trigger. */
export const Default: Story = {};

/** Open from the bottom, as in portrait. Resize the viewport to a phone to see the geometry. */
export const Open: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true },
};

/** In landscape the sheet opens from the end so the slide stays visible (MB9). */
export const Landscape: Story = {
  tags: ['wait-for-overlay'],
  args: { defaultOpen: true, position: 'end' },
};

/** A footer pinned under the scrolling body. */
export const WithFooter: Story = {
  tags: ['wait-for-overlay'],
  args: {
    defaultOpen: true,
    title: 'Updates',
    children: (
      <Rows
        items={['Rafaela raised a hand · 2 min', 'Bruno: Do you have the link?', 'Room 2 asked for help']}
      />
    ),
    footer: (
      <Button variant="primary" className="w-full">
        Open People
      </Button>
    ),
  },
};

/**
 * The student actions sheet opens over People (MB4): one stacking model
 * and a single scrim (P4). Closing the second returns to the first.
 */
export const Stacked: Story = {
  tags: ['wait-for-overlay'],
  render: (args) => (
    <Sheet {...args} defaultOpen title="People" headerExtra={<span className="text-text-muted">14</span>}>
      <Sheet
        defaultOpen
        title="Actions for Anton Georgiev"
        trigger={
          <Button variant="ghost" className="h-control-touch w-full justify-start px-2 text-text">
            <Avatar name="Anton Georgiev" size="md" />
            Anton Georgiev
          </Button>
        }
        footer={
          <Button tone="danger" className="w-full">
            Remove from session
          </Button>
        }
      >
        <Rows items={['Message', 'Make presenter', 'Turn off camera']} />
      </Sheet>
      <Rows items={['Michelle Winkler', 'Ellen', 'Timo', 'Marta Ribeiro']} />
    </Sheet>
  ),
};

/** Driven from state, without a trigger, as the mobile routes open sheets from the URL. */
export const WithoutTrigger: Story = {
  tags: ['wait-for-overlay'],
  args: { trigger: undefined, isOpen: true },
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
};
