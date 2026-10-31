/**
 * Maps a People row's `ParticipantAction` (the ⋯ menu on desktop, the
 * student sheet on the phone) to the store action, so both read the same
 * rules: the Microphone switch is checked only while the mic is on, "on"
 * for a muted person asks them to unmute or cancels the pending request
 * (S1), "off" mutes.
 */
import { useCallback } from 'react';
import type { ParticipantAction } from '../../components';
import { useRoomDispatch, useRoomStore } from '../../mocks/context';
import type { ParticipantId } from '../../mocks/types';

export function useParticipantActions(): (participantId: ParticipantId, action: ParticipantAction) => void {
  const store = useRoomStore();
  const dispatch = useRoomDispatch();
  return useCallback(
    (participantId, action) => {
      switch (action.type) {
        case 'makePresenter':
          return dispatch({ type: 'makePresenter', participantId });
        case 'setCamera':
          return dispatch({ type: 'setCamera', participantId, on: action.on });
        case 'microphone': {
          if (!action.on) return dispatch({ type: 'mute', participantId });
          const pending = store.getState().participants.find((p) => p.id === participantId)?.unmuteRequested;
          return dispatch({ type: pending ? 'cancelUnmuteRequest' : 'requestUnmute', participantId });
        }
        case 'flag':
          return dispatch({
            type: 'setParticipantFlag',
            participantId,
            flag: action.flag,
            value: action.value,
          });
        case 'remove':
          return dispatch({ type: 'removeParticipant', participantId });
      }
    },
    [dispatch, store],
  );
}
