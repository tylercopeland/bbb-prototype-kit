/**
 * The store context and the hooks that read it. `useRoom(selector)` is the
 * way components read meeting state; `useRoomDispatch()` is the way they
 * change it (CLAUDE.md › Routes and state).
 */
import { createContext, useCallback, useContext, useRef, useSyncExternalStore } from 'react';
import type { RoomAction } from './reducer';
import type { RoomStore } from './store';
import type { RoomState } from './types';

export const RoomStoreContext = createContext<RoomStore | null>(null);

export function useRoomStore(): RoomStore {
  const store = useContext(RoomStoreContext);
  if (!store) throw new Error('useRoom must be used inside a RoomProvider');
  return store;
}

/**
 * Reads `selector(state)` and re-renders when its result changes (by
 * `Object.is`). A selector that builds a new array each call must be
 * memoized (the `select*` exports are), or come from `useCallback`; an
 * inline selector that returns a primitive or an object already in the
 * state is fine.
 */
export function useRoom<T>(selector: (state: RoomState) => T): T {
  const store = useRoomStore();
  const cache = useRef<{ state: RoomState; selector: (state: RoomState) => T; value: T } | null>(null);
  const getSnapshot = useCallback(() => {
    const state = store.getState();
    const last = cache.current;
    if (last && last.state === state && last.selector === selector) return last.value;
    const value = selector(state);
    cache.current = { state, selector, value };
    return value;
  }, [store, selector]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export function useRoomDispatch(): (action: RoomAction) => void {
  return useRoomStore().dispatch;
}
