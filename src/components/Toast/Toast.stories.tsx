import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UNSTABLE_ToastQueue as ToastQueue } from 'react-aria-components';
import { Announcer } from '../Announcer';
import { Button } from '../Button';
import { MAX_VISIBLE_TOASTS, ToastRegion, showToast, type ToastContent } from './Toast';

type Demo = { title: string; content: ToastContent; timeout?: number };

const demos: Demo[] = [
  {
    title: 'Recording started',
    content: { title: 'Recording started', description: 'Everyone sees the red dot.' },
  },
  {
    title: 'Student moved',
    content: { title: 'Ana Souza moved to Room 2', action: { label: 'Undo', onPress: () => {} } },
  },
  {
    title: 'Help request',
    content: { title: 'Room 3 asked for help', action: { label: 'Open room', onPress: () => {} } },
  },
  {
    title: 'Timed (8 s)',
    content: { title: 'Poll shared with everyone' },
    timeout: 8000,
  },
  {
    title: 'Connection lost',
    content: {
      title: 'Connection lost',
      description: 'Trying to reconnect. Your audio is paused.',
      tone: 'danger',
      politeness: 'assertive',
    },
  },
];

/**
 * Each story owns a queue, so toasts from one story do not show up in
 * another. `initial` toasts are shown on mount, for the open stories.
 */
function Playground({ initial = [] }: { initial?: Demo[] }) {
  const [queue] = useState(() => new ToastQueue<ToastContent>({ maxVisibleToasts: MAX_VISIBLE_TOASTS }));
  useEffect(() => {
    for (const demo of initial) showToast(demo.content, { timeout: demo.timeout }, queue);
    return () => queue.clear();
  }, [initial, queue]);
  return (
    <Announcer>
      <div className="flex flex-wrap gap-2 rounded-panel bg-surface p-4">
        {demos.map((demo) => (
          <Button
            key={demo.title}
            size="sm"
            onPress={() => showToast(demo.content, { timeout: demo.timeout }, queue)}
          >
            {demo.title}
          </Button>
        ))}
      </div>
      <ToastRegion queue={queue} />
    </Announcer>
  );
}

const meta = {
  title: 'Components/Toast',
  component: ToastRegion,
  render: () => <Playground />,
  argTypes: { queue: { control: false } },
  decorators: [
    (Story) => (
      <div className="flex min-h-96 items-start justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToastRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Press a button to show a toast. Toasts stay until closed unless they were given a timeout of 5 s or more. */
export const Default: Story = {};

/** One of each kind open, so axe scans the region, the alertdialogs and their buttons. */
export const Open: Story = {
  tags: ['wait-for-overlay'],
  render: () => <Playground initial={[demos[0], demos[1], demos[4]]} />,
};

/** Three show at a time; the rest wait in the queue and appear as toasts close. */
export const Queued: Story = {
  tags: ['wait-for-overlay'],
  render: () => <Playground initial={demos} />,
};

export const OpenOnStage: Story = {
  tags: ['wait-for-overlay'],
  globals: { surface: 'stage' },
  render: () => <Playground initial={[demos[0], demos[4]]} />,
};

export const Stage: Story = {
  globals: { surface: 'stage' },
};
