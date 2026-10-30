import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createRoom,
  FIXTURE_NOW,
  selectDirectList,
  selectPeople,
  selectPeopleFilterCounts,
  selectRaisedHands,
  selectUnreadTotal,
  type Panel,
  type ParticipantFixture,
} from '../../mocks';
import { DMList } from '../DMList';
import { ParticipantList } from '../ParticipantList';
import { SidePanel, type SidePanelTab } from './SidePanel';

/** The panel over a fixture, with the tab in local state and the lists as its content. */
function Demo({
  people = 'class',
  panel: initial = 'people',
}: {
  people?: ParticipantFixture;
  panel?: Exclude<Panel, 'none'>;
}) {
  const [state] = useState(() => createRoom({ participants: people }));
  const [panel, setPanel] = useState<Exclude<Panel, 'none'>>(initial);
  const [closed, setClosed] = useState(false);
  const { hands, others } = selectPeople('all')(state);
  if (closed) return <p className="p-4 text-sm text-text-muted">Panel closed</p>;
  return (
    <SidePanel
      panel={panel}
      raisedHands={selectRaisedHands(state).length}
      unread={selectUnreadTotal(state)}
      onPanelChange={(p: SidePanelTab) => setPanel(p)}
      onClose={() => setClosed(true)}
      people={
        <ParticipantList
          hands={hands}
          others={others}
          counts={selectPeopleFilterCounts(state)}
          filter="all"
          now={FIXTURE_NOW}
        />
      }
      chat={<DMList threads={selectDirectList(state)} />}
    >
      <p className="p-4 text-sm text-text-muted">Arrives in milestone 5.</p>
    </SidePanel>
  );
}

const meta = {
  title: 'Components/SidePanel',
  component: Demo,
  parameters: { layout: 'fullscreen' },
  args: { people: 'class', panel: 'people' },
  argTypes: {
    people: { control: 'radio', options: ['one', 'four', 'class', 'thirty', 'longNames', 'duplicateNames'] },
    panel: { control: 'radio', options: ['people', 'chat', 'notes', 'poll'] },
  },
  decorators: [
    (Story) => (
      <div className="flex h-dvh w-full bg-surface-stage">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** G1: People open, with the hands count on the tab and the unread count on Chat. */
export const People: Story = {};

/** G3: Chat open; the Chat tab loses its badge once it is read. */
export const Chat: Story = { args: { panel: 'chat' } };

/** Notes and Poll show a plain title instead of the tabs. */
export const Notes: Story = { args: { panel: 'notes' } };

export const OneParticipant: Story = { args: { people: 'one' } };
export const ThirtyParticipants: Story = { args: { people: 'thirty' } };
export const LongNames: Story = { args: { people: 'longNames' } };

export const Stage: Story = {
  globals: { surface: 'stage' },
};
