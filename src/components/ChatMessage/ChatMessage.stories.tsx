import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, formatTimeOfDay, selectSelf, type ParticipantFixture } from '../../mocks';
import { ChatMessage } from './ChatMessage';

const meta = {
  title: 'Components/ChatMessage',
  component: ChatMessage,
  args: {
    name: 'Rafaela Monaco',
    participantId: 'rafaela',
    time: '9:02',
    isSelf: false,
    variant: 'public',
    children: 'Will the new layout work for 25+ classes too?',
  },
  argTypes: {
    variant: { control: 'radio', options: ['public', 'bubble'] },
  },
  decorators: [
    (Story) => (
      <ol className="flex w-80 list-none flex-col gap-3 rounded-panel bg-surface p-4">
        <Story />
      </ol>
    ),
  ],
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One message in the Everyone list. */
export const Public: Story = {};

/** The private thread: theirs on the left, yours on the right in blue. */
export const Bubbles: Story = {
  render: (args) => (
    <>
      <ChatMessage {...args} variant="bubble" name="Bruno" participantId="bruno" time="8:51">
        Do you have the link to the notes?
      </ChatMessage>
      <ChatMessage {...args} variant="bubble" isSelf name="Prof. Helena Costa" participantId="helena" time="8:52">
        It’s in the Notes panel, right next to Chat
      </ChatMessage>
    </>
  ),
};

/** The whole Everyone list of a fixture, from the store: the class, or a 1:1 call with one message. */
function Everyone({ people, chat }: { people: ParticipantFixture; chat?: 'default' | 'empty' }) {
  const state = createRoom({ participants: people, chat });
  const me = selectSelf(state)?.id;
  const nameOf = (id: string) => state.participants.find((p) => p.id === id)?.name ?? 'Someone';
  if (state.chat.everyone.length === 0) return <li className="text-sm text-text-muted">No messages yet</li>;
  return (
    <>
      {state.chat.everyone.map((m) => (
        <ChatMessage key={m.id} name={nameOf(m.from)} participantId={m.from} time={formatTimeOfDay(m.sentAt)} isSelf={m.from === me}>
          {m.text}
        </ChatMessage>
      ))}
    </>
  );
}

export const OneParticipant: Story = { render: () => <Everyone people="one" /> };
export const FourteenParticipants: Story = { render: () => <Everyone people="class" /> };
export const ThirtyParticipants: Story = { render: () => <Everyone people="thirty" /> };
export const EmptyChat: Story = { render: () => <Everyone people="class" chat="empty" /> };

/** A long name truncates on the meta line; the text wraps. */
export const LongName: Story = {
  args: {
    name: 'Rafaela Monaco de Albuquerque Cavalcanti',
    children:
      'A long message that wraps onto several lines so the layout can be checked at the panel width without a word being cut.',
  },
};

/** Long text inside a bubble wraps within its 256px cap. */
export const LongBubble: Story = {
  args: {
    variant: 'bubble',
    isSelf: true,
    children: 'A long private reply that needs more than one line to show that bubbles wrap and keep their side.',
  },
};

export const Stage: Story = {
  globals: { surface: 'stage' },
  render: (args) => (
    <>
      <ChatMessage {...args} />
      <ChatMessage {...args} variant="bubble" isSelf name="Prof. Helena Costa" participantId="helena" time="9:04">
        Yes! Hold that thought.
      </ChatMessage>
    </>
  ),
};
