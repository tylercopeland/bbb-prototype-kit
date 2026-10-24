import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { tv } from '../../styles/tv';

/**
 * The live regions are visually hidden; they exist from mount on, because a
 * live region only announces changes made after assistive technology has
 * seen it.
 */
export const announcerStyles = tv({ base: 'sr-only' });

export type Politeness = 'polite' | 'assertive';

export interface AnnouncerContextValue {
  /**
   * Speaks `message` through the live region for `politeness`
   * (default `polite`). The same message can be announced twice in a row.
   */
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

const noop: AnnouncerContextValue = { announce: () => {} };

/** How long a message stays in the region before it is cleared, so a later focus change does not re-read it. */
export const ANNOUNCEMENT_LIFETIME = 7000;

/**
 * `announce(message, politeness)` from the nearest `Announcer`. Outside one
 * it is a no-op, so a component can announce without caring whether the
 * provider is mounted (stories and unit tests of other components).
 */
export function useAnnouncer(): AnnouncerContextValue {
  return useContext(AnnouncerContext) ?? noop;
}

type Slot = { seq: number; message: string };

export interface AnnouncerProps {
  children?: ReactNode;
}

/**
 * The one place the prototype speaks to assistive technology outside the
 * focused control (X10). It renders two visually hidden live regions, a
 * polite `role="status"` and an assertive `role="alert"`, and provides
 * `announce` through `useAnnouncer()`. Mount it once, at the app root
 * (every Storybook story that announces wraps itself in it).
 *
 * Which events use which politeness (CLAUDE.md › Accessibility):
 *
 * - **polite**: a new chat message, a raised hand, a help request from a
 *   breakout room, a poll answer coming in, a toast, a student moved to a
 *   room ("Ana moved to Room 2", B2), a sheet or panel opening its content.
 * - **assertive**: the timer finishing, breakout rooms closing (the start
 *   of the countdown, B5), and losing the connection.
 *
 * Never put a ticking clock or a changing count in a live region: the
 * session timer and the "Rooms close in 0:59" countdown are plain text,
 * and only their start and end are announced.
 *
 * Each message is rendered in a fresh `<span key>` inside the stable
 * region, so repeating the same text is a new DOM insertion and is read
 * again. Messages clear after `ANNOUNCEMENT_LIFETIME`.
 */
export function Announcer({ children }: AnnouncerProps) {
  const [polite, setPolite] = useState<Slot>({ seq: 0, message: '' });
  const [assertive, setAssertive] = useState<Slot>({ seq: 0, message: '' });
  const timers = useRef<Partial<Record<Politeness, ReturnType<typeof setTimeout>>>>({});

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    const set = politeness === 'assertive' ? setAssertive : setPolite;
    set((slot) => ({ seq: slot.seq + 1, message }));
    const pending = timers.current[politeness];
    if (pending) clearTimeout(pending);
    timers.current[politeness] = setTimeout(() => {
      set((slot) => ({ seq: slot.seq + 1, message: '' }));
    }, ANNOUNCEMENT_LIFETIME);
  }, []);

  useEffect(() => {
    const current = timers.current;
    return () => {
      for (const timer of Object.values(current)) if (timer) clearTimeout(timer);
    };
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className={announcerStyles()}>
        {polite.message && <span key={polite.seq}>{polite.message}</span>}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className={announcerStyles()}>
        {assertive.message && <span key={assertive.seq}>{assertive.message}</span>}
      </div>
    </AnnouncerContext.Provider>
  );
}
