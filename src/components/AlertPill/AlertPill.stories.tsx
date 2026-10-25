import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, roomReducer, selectAlerts, type ParticipantFixture } from '../../mocks';
import { AlertPill } from './AlertPill';

const meta = {
  title: 'Components/AlertPill',
  component: AlertPill,
  args: {
    kind: 'hands',
    children: '4 raised',
    description: 'Opens People',
  },
  argTypes: {
    kind: { control: 'radio', options: ['hands', 'question', 'insight', 'help', 'back'] },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 flex-wrap items-center gap-2 p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AlertPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The three canvas pills: raised hands, a question, the insight. */
export const Kinds: Story = {
  render: (args) => (
    <>
      <AlertPill {...args} kind="hands">
        4 raised
      </AlertPill>
      <AlertPill {...args} kind="question" description="Opens Chat">
        Rafaela asked
      </AlertPill>
      <AlertPill {...args} kind="insight" description="Opens People filtered to low engagement">
        3 low engagement
      </AlertPill>
      <AlertPill {...args} kind="help" description="Opens Room 2">
        Room 2 asked for help
      </AlertPill>
      <AlertPill {...args} kind="back" description="Shows the rooms' work">
        Breakouts ended · 4 rooms’ work saved
      </AlertPill>
    </>
  ),
};

/** Every pill the store derives for a fixture, in the header's order (none for a 1:1 call with no hands up). */
function FromState({ people }: { people: ParticipantFixture }) {
  const alerts = selectAlerts(createRoom({ participants: people }));
  if (alerts.length === 0) return <p className="text-sm text-text-muted">No alerts</p>;
  return (
    <>
      {alerts.map((a) => (
        <AlertPill key={a.id} kind={a.kind}>
          {a.text}
        </AlertPill>
      ))}
    </>
  );
}

export const OneParticipant: Story = { render: () => <FromState people="one" /> };
export const FourteenParticipants: Story = { render: () => <FromState people="class" /> };
export const ThirtyParticipants: Story = { render: () => <FromState people="thirty" /> };

/** Rooms closed: the "Breakouts ended" pill, from state. */
export const RoomsClosed: Story = {
  render: () => {
    const state = [{ type: 'openRooms' } as const, { type: 'bringEveryoneBack' } as const].reduce(roomReducer, createRoom());
    return (
      <>
        {selectAlerts(state).map((a) => (
          <AlertPill key={a.id} kind={a.kind}>
            {a.text}
          </AlertPill>
        ))}
      </>
    );
  },
};

/** A long name truncates (D6); focus shows the whole text in a tooltip. The name stays the full text. */
export const LongText: Story = {
  tags: ['wait-for-tooltip'],
  args: {
    kind: 'question',
    children: 'Rafaela Monaco de Albuquerque Cavalcanti asked',
    description: 'Opens Chat',
    autoFocus: true,
  },
};

/** Keyboard focus on a pill. */
export const Focused: Story = {
  args: { autoFocus: true },
};

/** On the stage, where the pills live. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  render: () => <FromState people="class" />,
};
