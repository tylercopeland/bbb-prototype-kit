import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, pollResults, selectPollEligible, selectPollResults, type PollState } from '../../mocks';
import { PollResults as PollResultsComponent } from './PollResults';

const room = createRoom();
const canvasPoll = room.poll;

const forPoll = (poll: PollState) => ({
  question: poll.question,
  results: pollResults(poll),
  answered: poll.votes.reduce((a, b) => a + b, 0),
  eligible: selectPollEligible(room),
  anonymous: poll.anonymous,
});

const meta = {
  title: 'Components/PollResults',
  component: PollResultsComponent,
  args: {
    question: canvasPoll.question,
    results: selectPollResults(room),
    answered: 9,
    eligible: 13,
    phase: 'live',
    shown: false,
    anonymous: true,
    variant: 'panel',
  },
  argTypes: {
    variant: { control: 'radio', options: ['panel', 'stage'] },
    phase: { control: 'radio', options: ['live', 'ended'] },
    results: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-panel rounded-panel bg-surface p-4 text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PollResultsComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** PL2: live, 9 of 13 answered, only the teacher sees the results. */
export const Live: Story = {};

/** The poll is closed; the counts stay. */
export const Ended: Story = {
  args: { phase: 'ended' },
};

/** PL3, in the panel: the note says the results are on the stage. */
export const ShownInPanel: Story = {
  args: { shown: true },
};

/** Names visible to the teacher (anonymous off). */
export const NamesVisible: Story = {
  args: { anonymous: false },
};

/** Just asked: nobody has answered, every bar is empty and nothing is "most chosen". */
export const NoAnswers: Story = {
  args: { ...forPoll({ ...canvasPoll, votes: [0, 0, 0, 0] }), answered: 0 },
};

/** A 1–5 rating with a tie at the top. */
export const Rating: Story = {
  args: forPoll({
    ...canvasPoll,
    type: 'rate',
    question: 'How clear was today’s session?',
    options: ['1', '2', '3', '4', '5'],
    votes: [0, 1, 2, 4, 4],
  }),
};

/** Long answers wrap; the numbers stay on the right. */
export const LongAnswers: Story = {
  args: forPoll({
    ...canvasPoll,
    question:
      'Which of these changes to the People list would help you most during a lesson with thirty students?',
    options: [
      'Grey icons for everyone who is muted, with the same glyph in the webcam tiles',
      'A red badge on everyone who is not muted, so the exceptions stand out instead',
      'Hide the microphone icon altogether and rely on the speaking ring',
      'Text under each name saying muted, speaking or listening only',
      'Something else entirely, which I will write in the chat',
    ],
    votes: [6, 1, 0, 2, 3],
  }),
};

/** PL3, on the stage: the card everyone sees, with the Hide button. The results show shares only. */
export const OnStage: Story = {
  args: { variant: 'stage', shown: true },
  decorators: [
    (Story) => (
      <div className="w-120 p-4">
        <Story />
      </div>
    ),
  ],
};

/** The stage card over the dark stage, where it sits in the room. */
export const Stage: Story = {
  args: { variant: 'stage', shown: true },
  globals: { surface: 'stage' },
  decorators: [
    (Story) => (
      <div className="w-120 p-4">
        <Story />
      </div>
    ),
  ],
};
