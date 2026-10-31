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
import { createContext, useContext } from 'react';
import type { ParticipantId } from '../../mocks/types';

export type FocusRequest =
  /** The private thread's composer, after "Message privately". */
  | { kind: 'composer' }
  /** The person's row in the Direct list (or the Direct tab when the row is gone), after "Back". */
  | { kind: 'dmRow'; participantId: ParticipantId }
  /** The Poll panel's "Show results to everyone", after the stage card's Hide unmounted the card. */
  | { kind: 'pollShow' };

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
