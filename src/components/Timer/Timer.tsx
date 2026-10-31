import { useEffect, useRef, type Ref } from 'react';
import { Button as RacButton, composeRenderProps, type Selection } from 'react-aria-components';
import { Icon } from '../../icons';
import { formatCountdown } from '../../mocks/time';
import {
  cornerLabels,
  formatPreset,
  STAGE_CORNERS,
  TIMER_PRESETS,
  TIMER_URGENT_SEC,
  TIMER_WARN_SEC,
} from '../../mocks/timer';
import type { StageCorner, TimerPhase } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { Button } from '../Button';
import { Chip, ChipGroup } from '../ChipGroup';
import { IconButton } from '../IconButton';
import { Menu, MenuItem, MenuSection } from '../Menu';

/**
 * The class timer card (Focus.dc.html 173–199): a floating card with the
 * ring, the time, the quick times and the controls. 288px wide (the canvas
 * draws 280), the panel radius, the overlay shadow. It sits in the stage's
 * overlay layer, so inside `Surface kind="stage"` it takes the stage tokens
 * like every control drawn over the slide (milestone 4 decision).
 *
 * The ring's color follows the time left (blue, amber in the last minute,
 * red in the last ten seconds, green when done) and the status line says the
 * same in words, so the state is never color alone. The time is plain text,
 * never a live region (X10): only "Time's up" is announced, by the room.
 */
export const timerStyles = tv({
  slots: {
    root: 'flex w-72 max-w-full flex-col items-center gap-3 rounded-panel border border-border bg-surface p-4 text-text shadow-overlay',
    header: 'flex w-full items-start gap-1',
    title: 'flex min-w-0 flex-1 items-start gap-2 text-sm font-bold',
    titleIcon: 'mt-1 shrink-0 text-accent',
    titleText: 'flex min-w-0 flex-col',
    titleNote: 'truncate text-xs font-medium text-text-muted',
    ring: 'relative size-42',
    ringSvg: 'size-full -rotate-90',
    track: 'fill-none stroke-surface-raised',
    progress: 'fill-none transition-all',
    readout: 'absolute inset-0 flex flex-col items-center justify-center gap-1',
    time: 'text-2xl font-bold tabular-nums',
    status: 'text-xs font-semibold text-text-muted',
    controls: 'flex items-center gap-3',
  },
  variants: {
    tone: {
      running: { progress: 'stroke-accent' },
      warn: { progress: 'stroke-status-hand' },
      urgent: { root: 'border-danger-text', progress: 'stroke-danger', time: 'text-danger-text' },
      done: { root: 'border-status-live-text', progress: 'stroke-status-live' },
    },
    isPulsing: {
      true: { ring: 'animate-pulse motion-reduce:animate-none' },
    },
  },
  defaultVariants: { tone: 'running', isPulsing: false },
});

/**
 * The minimized pill (Focus.dc.html 202–205): a 40px button with the small
 * ring and the time. Pressing it restores the card.
 */
export const timerPillStyles = tv({
  base: 'flex h-control-lg items-center gap-2 rounded-full border border-border bg-surface pr-4 pl-2 text-lg font-bold text-text tabular-nums shadow-overlay focus-ring data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
  variants: {
    tone: {
      running: '',
      warn: '',
      urgent: 'border-danger-text text-danger-text',
      done: 'border-status-live-text',
    },
  },
  defaultVariants: { tone: 'running' },
});

export const timerPillRingStyles = tv({
  slots: {
    ring: 'size-7 shrink-0 -rotate-90',
    track: 'fill-none stroke-surface-raised',
    progress: 'fill-none',
  },
  variants: {
    tone: {
      running: { progress: 'stroke-accent' },
      warn: { progress: 'stroke-status-hand' },
      urgent: { progress: 'stroke-danger' },
      done: { progress: 'stroke-status-live' },
    },
  },
  defaultVariants: { tone: 'running' },
});

export type TimerTone = NonNullable<VariantProps<typeof timerStyles>['tone']>;

/** The ring color for the time left: blue, amber under a minute, red under ten seconds, green when done. */
export function timerTone(phase: TimerPhase, leftSec: number): TimerTone {
  if (phase === 'done') return 'done';
  if (leftSec <= TIMER_URGENT_SEC) return 'urgent';
  if (leftSec <= TIMER_WARN_SEC) return 'warn';
  return 'running';
}

/** The status line: the same meaning as the ring color, in words. */
export function timerStatus(phase: TimerPhase, leftSec: number): string {
  if (phase === 'done') return 'Time’s up!';
  if (phase === 'running') return leftSec <= TIMER_URGENT_SEC ? 'Almost there' : 'Running';
  if (phase === 'paused') return 'Paused';
  return 'Ready';
}

// The big ring: r 72 in a 168 box, and its circumference.
const RADIUS = 72;
const BOX = 168;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// The pill's ring: r 11 in a 28 box.
const PILL_RADIUS = 11;
const PILL_BOX = 28;
const PILL_CIRCUMFERENCE = 2 * Math.PI * PILL_RADIUS;

export interface TimerProps {
  /** `off` never renders: the room leaves the timer out then. */
  phase: Exclude<TimerPhase, 'off'>;
  /** Seconds left (`selectTimerLeft`). */
  leftSec: number;
  durationSec: number;
  corner: StageCorner;
  /** The pill instead of the card. */
  minimized?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onAddMinute?: () => void;
  /** A quick time was chosen, in seconds. */
  onDurationChange?: (durationSec: number) => void;
  /** "Move to corner" picked a corner; the room moves the card and announces it. */
  onCornerChange?: (corner: StageCorner) => void;
  /**
   * The "Move to corner" button. Moving the card to another corner remounts
   * it in that corner's slot, so the room focuses the new button through
   * this ref once the move has rendered (WCAG 2.4.3).
   */
  moveButtonRef?: Ref<HTMLButtonElement>;
  /** Minimize on the card, or a press on the pill. */
  onMinimizedChange?: (minimized: boolean) => void;
  /** Remove the timer. The room focuses Plugins, which added it, because the card unmounts. */
  onRemove?: () => void;
  className?: string;
  /** The card (a group) or the pill (a button). */
  ref?: Ref<HTMLElement>;
}

/**
 * A group named "Timer" with the header controls (Move to corner, a menu
 * of the four corners as radio items; Minimize; Remove), the ring with the
 * time and the status, the quick times as a `ChipGroup` (X8) and the
 * controls (Reset, Start / Pause / Restart, +1 min). Minimized, it is one
 * button, "Expand timer", with the time left.
 *
 * Minimize moves focus to the pill and the pill hands it back to Minimize,
 * because the pressed control unmounts either way (WCAG 2.4.3).
 */
export function Timer({
  phase,
  leftSec,
  durationSec,
  corner,
  minimized = false,
  onStart,
  onPause,
  onReset,
  onAddMinute,
  onDurationChange,
  onCornerChange,
  moveButtonRef,
  onMinimizedChange,
  onRemove,
  className,
  ref,
}: TimerProps) {
  const tone = timerTone(phase, leftSec);
  const styles = timerStyles({ tone, isPulsing: phase === 'running' && tone === 'urgent' });
  const pill = timerPillRingStyles({ tone });
  const time = formatCountdown(leftSec);
  const fraction = phase === 'done' ? 0 : Math.max(0, Math.min(1, leftSec / Math.max(1, durationSec)));

  // Which control takes focus after the card and the pill swap places.
  const focusAfter = useRef<'pill' | 'card' | null>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const minimizeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focusAfter.current === 'pill' && minimized) pillRef.current?.focus();
    if (focusAfter.current === 'card' && !minimized) minimizeRef.current?.focus();
    focusAfter.current = null;
  }, [minimized]);

  const onCorner = (keys: Selection) => {
    if (keys === 'all') return;
    const [key] = keys;
    if (typeof key === 'string' && key !== corner) onCornerChange?.(key as StageCorner);
  };

  if (minimized) {
    return (
      <RacButton
        ref={(node) => {
          pillRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        aria-label={`Expand timer, ${time} left`}
        onPress={() => {
          focusAfter.current = 'card';
          onMinimizedChange?.(false);
        }}
        className={composeRenderProps(className, (cls) => timerPillStyles({ tone, className: cls }))}
      >
        <svg viewBox={`0 0 ${PILL_BOX} ${PILL_BOX}`} aria-hidden="true" className={pill.ring()}>
          <circle
            cx={PILL_BOX / 2}
            cy={PILL_BOX / 2}
            r={PILL_RADIUS}
            strokeWidth="4"
            className={pill.track()}
          />
          <circle
            cx={PILL_BOX / 2}
            cy={PILL_BOX / 2}
            r={PILL_RADIUS}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={PILL_CIRCUMFERENCE.toFixed(1)}
            strokeDashoffset={(PILL_CIRCUMFERENCE * (1 - fraction)).toFixed(1)}
            className={pill.progress()}
          />
        </svg>
        {time}
      </RacButton>
    );
  }

  const running = phase === 'running';
  return (
    <div
      ref={ref as Ref<HTMLDivElement>}
      role="group"
      aria-label="Timer"
      className={styles.root({ className })}
    >
      <div className={styles.header()}>
        <p className={styles.title()}>
          <Icon name="timer" size="sm" className={styles.titleIcon()} />
          <span className={styles.titleText()}>
            Timer <span className={styles.titleNote()}>Everyone sees it</span>
          </span>
        </p>
        <Menu
          trigger={<IconButton ref={moveButtonRef} label="Move to corner" icon="moveToCorner" size="sm" />}
        >
          <MenuSection
            aria-label="Corner"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([corner])}
            onSelectionChange={onCorner}
          >
            {STAGE_CORNERS.map((c) => (
              <MenuItem key={c} id={c}>
                {cornerLabels[c]}
              </MenuItem>
            ))}
          </MenuSection>
        </Menu>
        <IconButton
          ref={minimizeRef}
          label="Minimize timer"
          icon="minimize"
          size="sm"
          onPress={() => {
            focusAfter.current = 'pill';
            onMinimizedChange?.(true);
          }}
        />
        <IconButton label="Remove timer" icon="close" size="sm" onPress={onRemove} />
      </div>
      <div className={styles.ring()}>
        <svg viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true" className={styles.ringSvg()}>
          <circle cx={BOX / 2} cy={BOX / 2} r={RADIUS} strokeWidth="12" className={styles.track()} />
          <circle
            cx={BOX / 2}
            cy={BOX / 2}
            r={RADIUS}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE.toFixed(1)}
            strokeDashoffset={(CIRCUMFERENCE * (1 - fraction)).toFixed(1)}
            className={styles.progress()}
          />
        </svg>
        <div className={styles.readout()}>
          <span className={styles.time()}>{time}</span>
          <span className={styles.status()}>{timerStatus(phase, leftSec)}</span>
        </div>
      </div>
      <ChipGroup
        label="Duration"
        labelHidden
        density="compact"
        value={TIMER_PRESETS.includes(durationSec) ? String(durationSec) : null}
        onChange={(value) => onDurationChange?.(Number(value))}
      >
        {TIMER_PRESETS.map((seconds) => (
          <Chip key={seconds} value={String(seconds)} density="compact">
            {formatPreset(seconds)}
          </Chip>
        ))}
      </ChipGroup>
      <div className={styles.controls()}>
        <IconButton label="Reset" icon="reset" variant="soft" size="lg" onPress={onReset} />
        <IconButton
          label={phase === 'done' ? 'Restart' : running ? 'Pause' : 'Start'}
          icon={running ? 'pause' : 'start'}
          variant="primary"
          size="touch"
          onPress={running ? onPause : onStart}
        />
        <Button variant="soft" size="lg" onPress={onAddMinute}>
          +1 min
        </Button>
      </div>
    </div>
  );
}
