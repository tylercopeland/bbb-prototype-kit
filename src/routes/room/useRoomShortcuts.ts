/**
 * The room's keyboard shortcuts (src/shortcuts.ts): Alt + M toggles the
 * microphone, Alt + V the camera, Alt + H the raised hand, for the local
 * person. Matched on `event.code`, so the letter is the physical key
 * whatever Alt does to `event.key` on the platform, and `preventDefault`
 * keeps the browser (Firefox's menu bar) from acting on the same keys.
 */
import { useEffect } from 'react';
import { useRoomStore } from '../../mocks/context';
import { selectSelf } from '../../mocks/selectors';
import { shortcuts } from '../../shortcuts';

export function useRoomShortcuts(): void {
  const store = useRoomStore();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const me = selectSelf(store.getState());
      if (!me) return;
      if (event.code === `Key${shortcuts.microphone.key}`) {
        const on = me.audio === 'live' || me.audio === 'speaking';
        store.dispatch({ type: 'setAudio', participantId: me.id, audio: on ? 'muted' : 'live' });
      } else if (event.code === `Key${shortcuts.camera.key}`) {
        store.dispatch({ type: 'setCamera', participantId: me.id, on: !me.camera });
      } else if (event.code === `Key${shortcuts.raiseHand.key}`) {
        store.dispatch({ type: me.handRaisedAt === null ? 'raiseHand' : 'lowerHand', participantId: me.id });
      } else {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store]);
}
