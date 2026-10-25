/**
 * A tiny external store over `roomReducer`, for `useSyncExternalStore`. No
 * state library: the store is `getState`, `dispatch` and `subscribe`, and
 * a `RoomProvider` hands one to the tree.
 */
import { roomReducer, type RoomAction } from './reducer';
import type { RoomState } from './types';

export type Listener = (state: RoomState, previous: RoomState) => void;

export interface RoomStore {
  getState: () => RoomState;
  dispatch: (action: RoomAction) => void;
  /** Returns the unsubscribe function. Listeners get the new and the previous state. */
  subscribe: (listener: Listener) => () => void;
}

export function createRoomStore(initialState: RoomState): RoomStore {
  let state = initialState;
  const listeners = new Set<Listener>();
  return {
    getState: () => state,
    dispatch: (action) => {
      const previous = state;
      const next = roomReducer(previous, action);
      if (next === previous) return;
      state = next;
      for (const listener of listeners) listener(next, previous);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
