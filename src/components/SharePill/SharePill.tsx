import type { ComponentProps } from 'react';
import type { ScreenKind } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { Button } from '../Button';

/**
 * The live-share pill (Focus.dc.html 72–76): a 40px pill with the live dot,
 * what everyone sees and the Stop sharing button. It takes the surface it
 * sits on, so in the stage's chrome row it is the dark pill the canvas
 * draws; the dot is the danger text color, the same red as the "REC" mark.
 */
export const sharePillStyles = tv({
  slots: {
    root: 'flex h-control-lg max-w-full items-center gap-3 rounded-full border border-border bg-surface py-1 pr-1 pl-4 text-sm text-text shadow-overlay',
    dot: 'size-2 shrink-0 rounded-full bg-danger-text',
    note: 'min-w-0 truncate',
    stop: 'shrink-0 rounded-full',
  },
});

export type SharePillShowing = 'screen' | 'slides';

export interface SharePillProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What is on stage for everyone while the screen is shared. */
  showing: SharePillShowing;
  kind: ScreenKind;
  onStop?: () => void;
  className?: string;
}

/** "Everyone sees your entire screen", or "… your slides · your screen is still shared" (M2). */
export function sharePillNote(showing: SharePillShowing, kind: ScreenKind): string {
  return showing === 'screen'
    ? `Everyone sees your ${kind.toLowerCase()}`
    : 'Everyone sees your slides · your screen is still shared';
}

/**
 * A plain group, not a live region: the presenter changed the tab or
 * started the share themselves, and the tab reports its own state. Stop
 * sharing is a small danger button inside the pill.
 */
export function SharePill({ showing, kind, onStop, className, ...props }: SharePillProps) {
  const styles = sharePillStyles();
  return (
    <div role="group" aria-label="Screen share" {...props} className={styles.root({ className })}>
      <span aria-hidden="true" className={styles.dot()} />
      <span className={styles.note()}>{sharePillNote(showing, kind)}</span>
      <Button variant="primary" tone="danger" size="sm" onPress={onStop} className={styles.stop()}>
        Stop sharing
      </Button>
    </div>
  );
}
