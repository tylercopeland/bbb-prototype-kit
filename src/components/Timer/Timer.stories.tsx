import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Announcer } from '../Announcer';
import { Timer as TimerComponent, type TimerProps } from './Timer';

/** The card holds its state here; in the room it comes from the store and the clock ticks it. */
function LiveTimer(props: Partial<TimerProps>) {
  const [state, setState] = useState<
    Pick<TimerProps, 'phase' | 'leftSec' | 'durationSec' | 'corner' | 'minimized'>
  >({
    phase: props.phase ?? 'ready',
    leftSec: props.leftSec ?? props.durationSec ?? 300,
    durationSec: props.durationSec ?? 300,
    corner: props.corner ?? 'topRight',
    minimized: props.minimized ?? false,
  });
  return (
    <TimerComponent
      {...props}
      {...state}
      onStart={() =>
        setState((s) => ({ ...s, phase: 'running', leftSec: s.phase === 'done' ? s.durationSec : s.leftSec }))
      }
      onPause={() => setState((s) => ({ ...s, phase: 'paused' }))}
      onReset={() => setState((s) => ({ ...s, phase: 'ready', leftSec: s.durationSec }))}
      onAddMinute={() =>
        setState((s) => ({
          ...s,
          leftSec: s.leftSec + 60,
          durationSec: Math.max(s.durationSec, s.leftSec + 60),
        }))
      }
      onDurationChange={(durationSec) =>
        setState((s) => ({ ...s, phase: 'ready', durationSec, leftSec: durationSec }))
      }
      onCornerChange={(corner) => setState((s) => ({ ...s, corner }))}
      onMinimizedChange={(minimized) => setState((s) => ({ ...s, minimized }))}
    />
  );
}

const meta = {
  title: 'Components/Timer',
  component: TimerComponent,
  args: {
    phase: 'ready',
    leftSec: 300,
    durationSec: 300,
    corner: 'topRight',
    minimized: false,
  },
  argTypes: {
    phase: { control: 'radio', options: ['ready', 'running', 'paused', 'done'] },
    corner: { control: 'radio', options: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] },
  },
  render: (args) => <LiveTimer {...args} />,
  decorators: [
    (Story) => (
      <Announcer>
        <div className="flex min-h-120 items-start justify-center p-8">
          <Story />
        </div>
      </Announcer>
    ),
  ],
} satisfies Meta<typeof TimerComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** TM1: five minutes, ready to start. */
export const Ready: Story = {};

/** TM2: running, 3:42 left of 5:00. */
export const Running: Story = {
  args: { phase: 'running', leftSec: 222 },
};

export const Paused: Story = {
  args: { phase: 'paused', leftSec: 222 },
};

/** The last minute: the ring turns amber and the status still says "Running". */
export const LastMinute: Story = {
  args: { phase: 'running', leftSec: 48 },
};

/** The last ten seconds: red, pulsing (not under reduced motion), "Almost there". */
export const AlmostThere: Story = {
  args: { phase: 'running', leftSec: 7 },
};

/** TM4: time's up, the green border, Restart in place of Start. */
export const Done: Story = {
  args: { phase: 'done', leftSec: 0 },
};

/** After "+1 min" past a preset: no quick time is checked. */
export const CustomDuration: Story = {
  args: { phase: 'paused', leftSec: 360, durationSec: 360 },
};

/** Ten minutes: four digits in the ring. */
export const TenMinutes: Story = {
  args: { phase: 'ready', leftSec: 600, durationSec: 600 },
};

/** TM3: minimized to a pill; pressing it restores the card. */
export const Pill: Story = {
  args: { phase: 'running', leftSec: 222, minimized: true },
};

/** On the stage, where the card sits in the room: the stage tokens. */
export const Stage: Story = {
  args: { phase: 'running', leftSec: 222 },
  globals: { surface: 'stage' },
};
