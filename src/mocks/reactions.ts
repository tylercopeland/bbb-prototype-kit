/**
 * Reactions (D5: React does something real). The set is the Mobile board's
 * tray (Mobile.dc.html 470), so desktop and phone share one vocabulary (P8).
 * A reaction is a row in `state.reactions` with the room-clock time it was
 * sent; `selectReactions` keeps each person's latest one while it is alive.
 */
import { SECOND } from './time';
import type { ReactionKind } from './types';

export interface ReactionInfo {
  emoji: string;
  /** The accessible name, also the announcement ("Anton reacted: Thumbs up"). */
  label: string;
}

export const reactions: Record<ReactionKind, ReactionInfo> = {
  thumbsUp: { emoji: '👍', label: 'Thumbs up' },
  clap: { emoji: '👏', label: 'Clap' },
  laugh: { emoji: '😂', label: 'Laugh' },
  surprised: { emoji: '😮', label: 'Surprised' },
  love: { emoji: '❤️', label: 'Love' },
  celebrate: { emoji: '🎉', label: 'Celebrate' },
};

export const reactionKinds = Object.keys(reactions) as ReactionKind[];

/** How long a reaction shows on its sender's tile, on the room clock. */
export const REACTION_LIFETIME = 8 * SECOND;
