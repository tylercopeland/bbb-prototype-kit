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

/** How long a message stays in the region before it is removed, so a later focus change does not re-read it. */
export const ANNOUNCEMENT_LIFETIME = 7000;

/**
 * `announce(message, politeness)` from the nearest `Announcer`. Outside one
 * it is a no-op, so a component can announce without caring whether the
 * provider is mounted (stories and unit tests of other components).
 */
export function useAnnouncer(): AnnouncerContextValue {
  return useContext(AnnouncerContext) ?? noop;
}

type Message = { id: number; text: string };

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
 * Each message is appended as its own `<span>` to the region, which is
 * `aria-atomic="false"` with `aria-relevant="additions"`: assistive
 * technology reads each addition, so a burst (three raised hands in a
 * second) is read in full and nothing replaces a message before it is
 * read. Repeating the same text is a new insertion and is read again. Each
 * message is removed after `ANNOUNCEMENT_LIFETIME`.
 */
export function Announcer({ children }: AnnouncerProps) {
  const [polite, setPolite] = useState<Message[]>([]);
  const [assertive, setAssertive] = useState<Message[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    const set = politeness === 'assertive' ? setAssertive : setPolite;
    const id = nextId.current++;
    set((messages) => [...messages, { id, text: message }]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      set((messages) => messages.filter((m) => m.id !== id));
    }, ANNOUNCEMENT_LIFETIME);
    timers.current.add(timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
    };
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        className={announcerStyles()}
      >
        {polite.map((m) => (
          <span key={m.id}>{m.text}</span>
        ))}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="false"
        aria-relevant="additions"
        className={announcerStyles()}
      >
        {assertive.map((m) => (
          <span key={m.id}>{m.text}</span>
        ))}
      </div>
    </AnnouncerContext.Provider>
  );
}
