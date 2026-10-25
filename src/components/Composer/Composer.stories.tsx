import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createRoom,
  formatTimeOfDay,
  RoomProvider,
  selectOpenThread,
  selectSelf,
  useRoom,
  type ParticipantFixture,
  type ParticipantId,
} from '../../mocks';
import { ChatMessage } from '../ChatMessage';
import { Composer } from './Composer';

/** What the store holds, so a sent message shows up under the composer. */
function Thread({ to }: { to?: ParticipantId }) {
  const everyone = useRoom((s) => s.chat.everyone);
  const thread = useRoom(selectOpenThread);
  const participants = useRoom((s) => s.participants);
  const me = useRoom(selectSelf)?.id;
  const messages = to ? (thread?.messages ?? []) : everyone;
  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? 'Someone';
  if (messages.length === 0) return <p className="px-3 text-sm text-text-muted">No messages yet</p>;
  return (
    <ol className="flex list-none flex-col gap-3 px-3">
      {messages.map((m) => (
        <ChatMessage
          key={m.id}
          variant={to ? 'bubble' : 'public'}
          name={nameOf(m.from)}
          participantId={m.from}
          time={formatTimeOfDay(m.sentAt)}
          isSelf={m.from === me}
        >
          {m.text}
        </ChatMessage>
      ))}
    </ol>
  );
}

function Demo({ people = 'class', to, chat }: { people?: ParticipantFixture; to?: ParticipantId; chat?: 'default' | 'empty' }) {
  const state = createRoom({ participants: people, chat, ui: to ? { panel: 'chat', scope: 'direct', dm: to } : {} });
  return (
    <RoomProvider initialState={state}>
      <div className="flex w-90 flex-col gap-3 rounded-panel bg-surface py-3">
        <Thread to={to} />
        <Composer to={to} />
      </div>
    </RoomProvider>
  );
}

const meta = {
  title: 'Components/Composer',
  component: Demo,
  args: { people: 'class' },
  argTypes: {
    people: { control: 'radio', options: ['one', 'four', 'class', 'thirty', 'longNames', 'duplicateNames'] },
    to: { control: 'select', options: [undefined, 'rafaela', 'bruno', 'frederick'] },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "Message everyone": type and press Enter, and the message appears above. */
export const Everyone: Story = {};

/** A private thread: the lock and "Message Rafaela privately". */
export const Direct: Story = {
  args: { to: 'rafaela' },
};

/** A thread with no messages yet (G5: started from People). */
export const NewDirect: Story = {
  args: { to: 'frederick' },
};

export const OneParticipant: Story = { args: { people: 'one' } };
export const ThirtyParticipants: Story = { args: { people: 'thirty' } };
export const EmptyChat: Story = { args: { chat: 'empty' } };

/** A long first name in the label and placeholder. */
export const LongNames: Story = {
  args: { people: 'longNames', to: 'rafaela' },
};

export const Stage: Story = {
  globals: { surface: 'stage' },
};
