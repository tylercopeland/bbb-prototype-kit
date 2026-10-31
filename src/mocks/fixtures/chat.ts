/**
 * Chat fixtures from Focus.dc.html (1101–1105 the public messages, 637–640
 * the direct threads). Messages from people who are not in the room are
 * dropped, so a smaller fixture keeps only its own people's messages; for
 * no messages at all, `createRoom({ chat: 'empty' })`.
 */
import { timeOfDay } from '../time';
import type { ChatMessage, ChatState, Participant, QuestionAlert } from '../types';

const message = (
  id: string,
  from: string,
  time: [number, number],
  text: string,
  read = true,
): ChatMessage => ({
  id,
  from,
  sentAt: timeOfDay(time[0], time[1]),
  text,
  read,
});

const everyone: ChatMessage[] = [
  message('e1', 'anton', [8, 29], 'Hi all!'),
  message('e2', 'rafaela', [9, 2], 'Will the new layout work for 25+ classes too?', false),
  message('e3', 'helena', [9, 4], 'Yes! Hold that thought, we’ll get to scale on slide 9.'),
];

const direct: ChatState['direct'] = [
  {
    with: 'bruno',
    messages: [
      message('d1', 'bruno', [8, 51], 'Do you have the link to the notes?'),
      message('d2', 'helena', [8, 52], 'It’s in the Notes panel, right next to Chat'),
    ],
  },
  {
    with: 'rafaela',
    messages: [message('d3', 'rafaela', [9, 6], 'Can I share my screen right after Frederick?', false)],
  },
];

/** The "Rafaela asked" pill in the session header. */
export const questionAlerts: QuestionAlert[] = [
  { id: 'q1', kind: 'question', from: 'rafaela', messageId: 'e2' },
];

export function chatFor(participants: Participant[]): ChatState {
  const present = new Set(participants.map((p) => p.id));
  return {
    everyone: everyone.filter((m) => present.has(m.from)),
    direct: direct
      .filter((t) => present.has(t.with))
      .map((t) => ({ ...t, messages: t.messages.filter((m) => present.has(m.from)) })),
    seq: 0,
  };
}

export const emptyChat: ChatState = { everyone: [], direct: [], seq: 0 };
