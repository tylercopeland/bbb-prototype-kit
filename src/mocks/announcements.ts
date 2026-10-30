/**
 * What `RoomProvider` says through `Announcer` for the difference between
 * two states (CLAUDE.md › Accessibility):
 *
 * - polite: a new chat message from someone else, a raised hand, a help
 *   request from a room, a student moved to a room (B2), rooms opening
 * - assertive: the closing countdown starting (B5), the rooms closing and
 *   the class timer finishing
 * - nothing for `tick`: a ticking clock is never in a live region (X10)
 */
import type { Politeness } from '../components/Announcer';
import { roomName } from './breakouts';
import { reactions } from './reactions';
import { selectDisplayNames, selectRooms, selectSelf } from './selectors';
import type { RoomState } from './types';

export interface Announcement {
  message: string;
  politeness: Politeness;
}

export function announcementsFor(previous: RoomState, next: RoomState): Announcement[] {
  const out: Announcement[] = [];
  if (previous === next) return out;
  const names = selectDisplayNames(next);
  const me = selectSelf(next)?.id;
  const nameOf = (id: string) => names[id] ?? next.participants.find((p) => p.id === id)?.name ?? 'Someone';

  // Raised hands. Not your own: you pressed the button, and the toggle reports its state.
  const wasUp = new Set(previous.participants.filter((p) => p.handRaisedAt !== null).map((p) => p.id));
  for (const p of next.participants) {
    if (p.handRaisedAt !== null && !wasUp.has(p.id) && p.id !== me) {
      out.push({ message: `${nameOf(p.id)} raised their hand`, politeness: 'polite' });
    }
  }

  // Someone removed from the session: their row is gone, so the list cannot say it.
  const stillHere = new Set(next.participants.map((p) => p.id));
  const previousNames = selectDisplayNames(previous);
  for (const p of previous.participants) {
    if (!stillHere.has(p.id))
      out.push({ message: `${previousNames[p.id] ?? p.name} removed`, politeness: 'polite' });
  }

  // New chat messages from other people.
  const seen = new Set(previous.chat.everyone.map((m) => m.id));
  for (const t of previous.chat.direct) for (const m of t.messages) seen.add(m.id);
  for (const m of next.chat.everyone) {
    if (!seen.has(m.id) && m.from !== me)
      out.push({ message: `${nameOf(m.from)}: ${m.text}`, politeness: 'polite' });
  }
  for (const t of next.chat.direct) {
    for (const m of t.messages) {
      if (!seen.has(m.id) && m.from !== me) {
        out.push({ message: `Direct message from ${nameOf(m.from)}: ${m.text}`, politeness: 'polite' });
      }
    }
  }

  // Reactions from other people (D5), like a short chat message.
  const seenReactions = new Set(previous.reactions.items.map((r) => r.id));
  for (const r of next.reactions.items) {
    if (!seenReactions.has(r.id) && r.from !== me) {
      out.push({ message: `${nameOf(r.from)} reacted: ${reactions[r.kind].label}`, politeness: 'polite' });
    }
  }

  // Help requests.
  const known = new Set(previous.breakouts.helpQueue.map((h) => h.id));
  for (const h of next.breakouts.helpQueue) {
    if (!known.has(h.id)) {
      const who = h.from ? ` (${nameOf(h.from)})` : '';
      out.push({ message: `${roomName(h.roomIndex)}${who} asked for help`, politeness: 'polite' });
    }
  }

  // A manual move (B2): the student's new room.
  for (const [id, room] of Object.entries(next.breakouts.moves)) {
    if (previous.breakouts.moves[id] !== room) {
      out.push({ message: `${nameOf(id)} moved to ${roomName(room)}`, politeness: 'polite' });
    }
  }

  // Rooms opening, closing and closed.
  const b0 = previous.breakouts;
  const b1 = next.breakouts;
  if (b0.phase === 'setup' && b1.phase === 'live') {
    out.push({ message: `${selectRooms(next).length} breakout rooms opened`, politeness: 'polite' });
  }
  if (b0.closingEndsAt === null && b1.closingEndsAt !== null) {
    const seconds = Math.round((b1.closingEndsAt - next.clock.now) / 1000);
    out.push({ message: `Rooms close in ${seconds} seconds`, politeness: 'assertive' });
  } else if (b0.closingEndsAt !== null && b1.closingEndsAt === null && b1.phase === 'live') {
    out.push({ message: 'Rooms stay open', politeness: 'polite' });
  }
  if (b0.phase === 'live' && b1.phase === 'back') {
    out.push({
      message: 'Breakout rooms closed. Everyone is back in the main room',
      politeness: 'assertive',
    });
  }

  // The class timer finishing.
  if (previous.timer.phase !== 'done' && next.timer.phase === 'done') {
    out.push({ message: 'Time’s up', politeness: 'assertive' });
  }

  return out;
}
