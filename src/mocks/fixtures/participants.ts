/**
 * Participant fixtures. The 14-person class is the canvas's (Focus.dc.html
 * 622–668 and 1106–1123, Breakout.dc.html 367–372): the same people, audio
 * states, cameras, raised hands and low-engagement notes. The others are
 * built from it, so every screen scales from a 1:1 call to 30 people
 * without a literal count anywhere outside this folder.
 */
import { MINUTE, SECOND, timeOfDay } from '../time';
import type { AudioState, Engagement, Participant, ParticipantId, Role } from '../types';

/** The room clock when every fixture is captured: 9:06:06, with the session 29:36 old. */
export const FIXTURE_NOW = timeOfDay(9, 6, 6);
export const FIXTURE_STARTED_AT = FIXTURE_NOW - (29 * MINUTE + 36 * SECOND);

interface Seed {
  id: ParticipantId;
  name: string;
  role?: Role;
  audio?: AudioState;
  camera?: boolean;
  /** Minutes ago the hand went up; `0` is "just now". */
  handMin?: number;
  engagement?: Engagement;
}

export function participant(seed: Seed, now = FIXTURE_NOW): Participant {
  const role = seed.role ?? 'student';
  return {
    id: seed.id,
    name: seed.name,
    role,
    isSelf: false,
    audio: seed.audio ?? 'notJoined',
    camera: seed.camera ?? false,
    handRaisedAt: seed.handMin === undefined ? null : now - seed.handMin * MINUTE - (seed.handMin === 0 ? 10 * SECOND : 0),
    isPresenter: false,
    isModerator: role === 'teacher',
    hasWhiteboard: false,
    chatLocked: false,
    unmuteRequested: false,
    engagement: seed.engagement ?? { level: 'ok' },
  };
}

/** The teacher, presenting, mic live, camera on: "You" on every artboard. */
export const teacher: Participant = {
  ...participant({ id: 'helena', name: 'Prof. Helena Costa', role: 'teacher', audio: 'live', camera: true }),
  isSelf: true,
  isPresenter: true,
};

const low = (note: string): Engagement => ({ level: 'low', note });

/** The 13 students of the canvas class, in the People list's order. */
const classSeeds: Seed[] = [
  { id: 'bruno', name: 'Bruno', audio: 'muted', camera: true, handMin: 3 },
  { id: 'rafaela', name: 'Rafaela Monaco', audio: 'muted', camera: true, handMin: 2 },
  { id: 'cibelle', name: 'Cibelle Maciel', audio: 'muted', camera: false, handMin: 1 },
  { id: 'octavio', name: 'Octavio', audio: 'notJoined', camera: false, handMin: 0 },
  { id: 'frederick', name: 'Frederick Dixon', audio: 'speaking', camera: true },
  { id: 'anton', name: 'Anton Georgiev', audio: 'muted', camera: true },
  { id: 'michelle', name: 'Michelle Winkler', audio: 'muted', camera: true },
  { id: 'ellen', name: 'Ellen', audio: 'listening', camera: false },
  { id: 'timo', name: 'Timo', audio: 'notJoined', camera: false, engagement: low('Camera off · quiet for 22 min') },
  { id: 'marta', name: 'Marta Ribeiro', audio: 'muted', camera: true },
  { id: 'lucas', name: 'Lucas Pereira', audio: 'notJoined', camera: true },
  { id: 'ana', name: 'Ana Souza', audio: 'muted', camera: false, engagement: low('No chat or poll answers yet') },
  {
    id: 'joana',
    name: 'Joana Lima',
    audio: 'listening',
    camera: false,
    engagement: low('Missed the last poll · quiet for 18 min'),
  },
];
export const classStudents: Participant[] = classSeeds.map((s) => participant(s));

/** The canvas class: the teacher plus 13 students. */
export const classParticipants: Participant[] = [teacher, ...classStudents];

/** A 1:1 call's other side, or just the teacher alone. */
export const oneParticipant: Participant[] = [teacher];

/** A small call: the teacher and three students, one speaking, one hand up. */
export const fourParticipants: Participant[] = [
  teacher,
  classStudents.find((p) => p.id === 'frederick')!,
  classStudents.find((p) => p.id === 'bruno')!,
  classStudents.find((p) => p.id === 'ellen')!,
];

/** Sixteen more students, so the class reaches 30 and the lists scroll. */
const extraSeeds: Seed[] = [
  { id: 'beatriz', name: 'Beatriz Almeida', audio: 'muted', camera: true },
  { id: 'carlos', name: 'Carlos Nogueira', audio: 'listening', camera: false },
  { id: 'daniela', name: 'Daniela Rocha', audio: 'muted', camera: true, handMin: 5 },
  { id: 'eduardo', name: 'Eduardo Martins', audio: 'notJoined', camera: false },
  { id: 'fernanda', name: 'Fernanda Castro', audio: 'muted', camera: true },
  { id: 'gabriel', name: 'Gabriel Santos', audio: 'muted', camera: false, engagement: low('Quiet for 25 min') },
  { id: 'helga', name: 'Helga Lindqvist', audio: 'live', camera: true },
  { id: 'igor', name: 'Igor Petrov', audio: 'muted', camera: true },
  { id: 'julia', name: 'Júlia Barbosa', audio: 'listening', camera: false },
  { id: 'kenji', name: 'Kenji Watanabe', audio: 'muted', camera: true },
  { id: 'leila', name: 'Leila Haddad', audio: 'notJoined', camera: false },
  { id: 'mateus', name: 'Mateus Oliveira', audio: 'muted', camera: true },
  { id: 'nadia', name: 'Nádia Ferreira', audio: 'muted', camera: false },
  { id: 'otto', name: 'Otto Brandt', audio: 'listening', camera: true },
  { id: 'priya', name: 'Priya Raman', audio: 'muted', camera: true },
  { id: 'quentin', name: 'Quentin Dubois', audio: 'notJoined', camera: false, engagement: low('No chat yet') },
];
const extraStudents: Participant[] = extraSeeds.map((s) => participant(s));

/** Thirty people: the class plus sixteen more students. */
export const thirtyParticipants: Participant[] = [...classParticipants, ...extraStudents];

/** The class with names that overflow a row, a tile label and a DM pill (D6). */
export const longNameParticipants: Participant[] = classParticipants.map((p) => {
  switch (p.id) {
    case 'rafaela':
      return { ...p, name: 'Rafaela Monaco de Albuquerque Cavalcanti' };
    case 'frederick':
      return { ...p, name: 'Frederick Alexander Dixon-Whitworth III' };
    case 'michelle':
      return { ...p, name: 'Michelle Winkler-Oppenheimer von Hohenstein' };
    case 'bruno':
      return { ...p, name: 'Bruno Wolfeschlegelsteinhausenbergerdorff' };
    default:
      return p;
  }
});

/** The class with a second Ana, so first-name pills must tell them apart (B9). */
export const duplicateNameParticipants: Participant[] = [
  ...classParticipants,
  participant({ id: 'ana-ferreira', name: 'Ana Ferreira', audio: 'muted', camera: true, handMin: 4 }),
];

export const participantFixtures = {
  one: oneParticipant,
  four: fourParticipants,
  class: classParticipants,
  thirty: thirtyParticipants,
  longNames: longNameParticipants,
  duplicateNames: duplicateNameParticipants,
} as const;

export type ParticipantFixture = keyof typeof participantFixtures;
