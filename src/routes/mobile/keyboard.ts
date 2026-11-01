/**
 * The on-screen keyboard (MB17). The store holds its height as
 * `ui.keyboardInset`; this hook keeps it current from `visualViewport`
 * (the part of the layout viewport the keyboard covers: the window's inner
 * height minus the visual viewport's height and offset) and writes it to
 * `--bbb-keyboard-inset` on the document, which the `pb-keyboard` utility
 * reads on every sheet's overlay, so a bottom sheet and its composer end
 * above the keyboard. A route with `keyboard=open` starts from a fixed fake
 * height; a measurement of zero before any keyboard was seen is ignored,
 * so a window resize never flattens the fake and the screenshot stays
 * deterministic, while a real keyboard going down still clears it.
 */
import { useEffect, useRef } from 'react';
import { useRoom, useRoomDispatch } from '../../mocks/context';

export const KEYBOARD_INSET_PROPERTY = '--bbb-keyboard-inset';

export function useKeyboardInset(): number {
  const inset = useRoom((s) => s.ui.keyboardInset);
  const dispatch = useRoomDispatch();
  const sawKeyboard = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    // A measured length, not a token: the keyboard's height is whatever the device reports.
    root.style.setProperty(KEYBOARD_INSET_PROPERTY, `${inset}px`);
    return () => {
      root.style.removeProperty(KEYBOARD_INSET_PROPERTY);
    };
  }, [inset]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const measure = () => {
      const next = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
      if (next > 0) sawKeyboard.current = true;
      else if (!sawKeyboard.current) return;
      dispatch({ type: 'setKeyboardInset', inset: next });
    };
    viewport.addEventListener('resize', measure);
    viewport.addEventListener('scroll', measure);
    return () => {
      viewport.removeEventListener('resize', measure);
      viewport.removeEventListener('scroll', measure);
    };
  }, [dispatch]);

  return inset;
}
