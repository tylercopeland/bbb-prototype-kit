/**
 * `RoomProvider` holds the one room store for a screen and announces what
 * changes in it through `Announcer`, from one effect here, never from
 * components (see `announcements.ts` for the rules). Read the store with
 * `useRoom(selector)` and change it with `useRoomDispatch()`.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useAnnouncer } from '../components/Announcer';
import { announcementsFor } from './announcements';
import { RoomStoreContext } from './context';
import { createRoomStore, type RoomStore } from './store';
import type { RoomState } from './types';

export interface RoomProviderProps {
  /** The state the store starts from; later changes to this prop are ignored. */
  initialState?: RoomState;
  /** An existing store, for tests and stories that need to dispatch from outside. */
  store?: RoomStore;
  /** Advance the room clock every second from the browser's clock. Off by default, so routes render the same at any time. */
  liveClock?: boolean;
  children?: ReactNode;
}

export function RoomProvider({ initialState, store: givenStore, liveClock = false, children }: RoomProviderProps) {
  const [ownStore] = useState(() => {
    if (givenStore) return givenStore;
    if (!initialState) throw new Error('RoomProvider needs initialState or store');
    return createRoomStore(initialState);
  });
  const store = givenStore ?? ownStore;
  const { announce } = useAnnouncer();

  useEffect(
    () =>
      store.subscribe((next, previous) => {
        for (const a of announcementsFor(previous, next)) announce(a.message, a.politeness);
      }),
    [store, announce],
  );

  useEffect(() => {
    if (!liveClock) return;
    const start = Date.now();
    const base = store.getState().clock.now;
    const timer = setInterval(() => store.dispatch({ type: 'tick', now: base + (Date.now() - start) }), 1000);
    return () => clearInterval(timer);
  }, [liveClock, store]);

  return <RoomStoreContext.Provider value={store}>{children}</RoomStoreContext.Provider>;
}
