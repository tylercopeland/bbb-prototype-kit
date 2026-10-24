import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Announcer, useAnnouncer, type Politeness } from './Announcer';

/**
 * A panel of the events that announce, and a visible log of what was sent,
 * since the live regions themselves are visually hidden. Open a screen
 * reader (or the browser's accessibility tree) to hear them.
 */
function Demo() {
  const { announce } = useAnnouncer();
  const [log, setLog] = useState<string[]>([]);
  const say = (message: string, politeness: Politeness) => {
    announce(message, politeness);
    setLog((l) => [`${politeness}: ${message}`, ...l].slice(0, 5));
  };
  return (
    <div className="flex w-full max-w-panel flex-col gap-4 rounded-panel bg-surface p-4 text-text">
      <p className="text-sm font-semibold tracking-label text-text-muted uppercase">Polite</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onPress={() => say('New message from Bruno: Do you have the link to the notes?', 'polite')}
        >
          Chat message
        </Button>
        <Button size="sm" onPress={() => say('Rafaela Monaco raised a hand', 'polite')}>
          Raised hand
        </Button>
        <Button size="sm" onPress={() => say('Room 2 asked for help', 'polite')}>
          Help request
        </Button>
        <Button size="sm" onPress={() => say('Poll: 9 of 13 answered', 'polite')}>
          Poll answer
        </Button>
      </div>
      <p className="text-sm font-semibold tracking-label text-text-muted uppercase">Assertive</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onPress={() => say('Timer finished', 'assertive')}>
          Timer finished
        </Button>
        <Button size="sm" onPress={() => say('Breakout rooms close in one minute', 'assertive')}>
          Rooms closing
        </Button>
      </div>
      <ol aria-label="Sent announcements" className="flex flex-col gap-1 text-sm text-text-secondary">
        {log.length === 0 && <li className="text-text-muted">Nothing announced yet</li>}
        {log.map((entry, i) => (
          <li key={`${i}-${entry}`}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

const meta = {
  title: 'Components/Announcer',
  component: Announcer,
  render: () => (
    <Announcer>
      <Demo />
    </Announcer>
  ),
} satisfies Meta<typeof Announcer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The provider with the events that announce. The live regions are in the DOM but visually hidden. */
export const Default: Story = {};

export const Stage: Story = {
  globals: { surface: 'stage' },
};
