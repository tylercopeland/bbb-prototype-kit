/**
 * Where focus goes after a flow removes the element that held it (WCAG
 * 2.4.3). "Message privately" swaps the People tab for the thread and
 * "Back to direct messages" swaps the thread for the Direct list, so the
 * control that was pressed is gone by the time React commits. The screen
 * keeps one pending request; the component that renders the target takes
 * it in its mount effect and focuses the element itself. A request that
 * nothing takes is overwritten by the next one. Nothing here touches the
 * store, and nothing reads the request during render.
 */
import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import type { ParticipantId } from '../../mocks/types';

export type FocusRequest =
  /** The private thread's composer, after "Message privately". */
  | { kind: 'composer' }
  /** The person's row in the Direct list (or the Direct tab when the row is gone), after "Back". */
  | { kind: 'dmRow'; participantId: ParticipantId }
  /** The Poll panel's "Show results to everyone", after the stage card's Hide unmounted the card. */
  | { kind: 'pollShow' }
  /** A student's chip in their new room, after "Move to…" moved it to another card (B2). */
  | { kind: 'breakoutStudent'; participantId: ParticipantId }
  /** The live panel's first control, after "Open N rooms" replaced the setup panel. */
  | { kind: 'breakoutLive' }
  /** "Close all rooms", after the closing countdown was cancelled or the joined room left. */
  | { kind: 'closeRooms' }
  /** The first share-back control, after "Bring everyone back now" replaced the live surface. */
  | { kind: 'shareBack' }
  /** The breakout panel's heading, after "Set up new rooms" replaced the back view. */
  | { kind: 'breakoutSetup' };

export type FocusRequestKind = FocusRequest['kind'];

export interface RoomFocus {
  /** Records what should take focus once the next screen state has rendered. */
  requestFocus: (request: FocusRequest) => void;
  /** Returns and clears the pending request when it is of `kind`; call it from an effect. */
  takeFocus: <K extends FocusRequestKind>(kind: K) => Extract<FocusRequest, { kind: K }> | null;
}

export const RoomFocusContext = createContext<RoomFocus>({ requestFocus: () => {}, takeFocus: () => null });

/** The screen's focus requests. Outside a `RoomScreen` requests are dropped and nothing is ever pending. */
export function useRoomFocus(): RoomFocus {
  return useContext(RoomFocusContext);
}

/**
 * The one pending request a screen holds, as the context value for
 * `RoomFocusContext.Provider`. Written by a handler, taken by the target's
 * mount effect; the desktop room and the phone room share it.
 */
export function useRoomFocusState(): RoomFocus {
  const pendingFocus = useRef<FocusRequest | null>(null);
  const requestFocus = useCallback((request: FocusRequest) => {
    pendingFocus.current = request;
  }, []);
  const takeFocus = useCallback(<K extends FocusRequestKind>(kind: K) => {
    const pending = pendingFocus.current;
    if (pending?.kind !== kind) return null;
    pendingFocus.current = null;
    return pending as Extract<FocusRequest, { kind: K }>;
  }, []);
  return useMemo<RoomFocus>(() => ({ requestFocus, takeFocus }), [requestFocus, takeFocus]);
}

/**
 * Moves focus to `element` after an overlay inside another one has closed,
 * and keeps it there (WCAG 2.4.3). React Aria's focus containment on the
 * outer dialog re-focuses its own scope a frame after focus left it, so a
 * single move can lose the race: this one runs a tick later and checks
 * again over the next frames, until the element holds focus or is gone.
 */
export function focusAfterOverlay(element: HTMLElement | null | undefined): void {
  if (!element) return;
  let tries = 0;
  const settle = () => {
    if (!element.isConnected) return;
    if (document.activeElement !== element) element.focus();
    if (++tries < 4) setTimeout(settle, 20);
  };
  setTimeout(settle, 0);
}
