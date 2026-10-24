import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, roomReducer, selectDirectList, type ParticipantFixture, type RoomAction } from '../../mocks';
import { DMList } from './DMList';

const threadsFor = (people: ParticipantFixture, ...actions: RoomAction[]) =>
  selectDirectList(actions.reduce(roomReducer, createRoom({ participants: people })));

const meta = {
  title: 'Components/DMList',
  component: DMList,
  args: {
    threads: threadsFor('class'),
  },
  argTypes: {
    threads: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="flex h-120 w-90 flex-col rounded-panel bg-surface">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DMList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** G3: Rafaela's unread conversation first, then Bruno's, read. */
export const Default: Story = {};

/** Alone in the room: nobody to talk to yet. */
export const OneParticipant: Story = {
  args: { threads: threadsFor('one') },
};

/** Thirty people, and a dozen conversations: the list scrolls. */
export const ThirtyParticipants: Story = {
  args: {
    threads: threadsFor(
      'thirty',
      ...['beatriz', 'carlos', 'daniela', 'eduardo', 'fernanda', 'gabriel', 'helga', 'igor', 'julia', 'kenji'].map(
        (id, i): RoomAction => ({ type: 'sendMessage', from: id, text: `Question ${i + 1} about the slides`, to: 'helena' }),
      ),
    ),
  },
};

/** Long names truncate and show in full in a tooltip on hover or focus (D6). */
export const LongNames: Story = {
  args: { threads: threadsFor('longNames') },
};

/** A conversation just opened from People (G5): no messages yet, so no preview or time. */
export const NewConversation: Story = {
  args: { threads: threadsFor('class', { type: 'openDm', participantId: 'frederick' }) },
};

export const Stage: Story = {
  globals: { surface: 'stage' },
};
