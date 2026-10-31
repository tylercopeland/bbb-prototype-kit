import { useId, type Ref } from 'react';
import {
  Button as RacButton,
  composeRenderProps,
  type ButtonProps as RacButtonProps,
} from 'react-aria-components';
import { tv } from '../../styles/tv';
import { alertPillIconStyles, type AlertPillKind } from '../AlertPill';

/**
 * The phone's one alert pill (Mobile.dc.html 31–33): the desktop's three
 * pills collapse into "3 updates", a dashed pill on the stage with the
 * alerts' colored discs stacked at its start. 44px tall for touch (X14; the
 * canvas draws 34), the same fills and dashed border as `AlertPill`.
 */
export const updatesPillStyles = tv({
  base: 'inline-flex h-control-touch max-w-full shrink-0 items-center gap-2 rounded-full border border-dashed border-border-control bg-surface-sunken pr-4 pl-2 text-sm font-semibold whitespace-nowrap text-text focus-ring data-hovered:bg-surface-raised data-pressed:bg-surface-raised',
});

/** The stacked discs: each one after the first overlaps by a quarter and keeps a ring in the pill's fill, so they read as separate. */
export const updatesPillStackStyles = tv({ base: 'flex items-center' });

export const updatesPillDiscStyles = tv({
  extend: alertPillIconStyles,
  base: 'ring-2 ring-surface-sunken not-first:-ml-2',
});

export interface UpdatesPillProps extends Omit<
  RacButtonProps,
  'className' | 'children' | 'aria-label' | 'aria-describedby'
> {
  /** The alerts, in order; one disc each (at most three are drawn) and the count in the text. */
  kinds: AlertPillKind[];
  /** What pressing opens, read after the name: "Opens the updates sheet". */
  description?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/** "3 updates" or "1 update". */
export function formatUpdates(count: number): string {
  return count === 1 ? '1 update' : `${count} updates`;
}

/** The discs drawn: the first three alerts, as on the canvas. */
export const MAX_UPDATE_DISCS = 3;

/**
 * A button whose accessible name is exactly its visible text (D4), "3
 * updates", with what it opens as its description. The discs are
 * decorative: the sheet it opens names each alert. Renders nothing for an
 * empty list, so the header never shows "0 updates".
 */
export function UpdatesPill({ kinds, description, className, ref, ...props }: UpdatesPillProps) {
  const descriptionId = useId();
  if (kinds.length === 0) return null;
  return (
    <>
      <RacButton
        {...props}
        ref={ref}
        aria-describedby={description ? descriptionId : undefined}
        className={composeRenderProps(className, (cls) => updatesPillStyles({ className: cls }))}
      >
        <span aria-hidden="true" className={updatesPillStackStyles()}>
          {kinds.slice(0, MAX_UPDATE_DISCS).map((kind, i) => (
            <span key={`${kind}-${i}`} className={updatesPillDiscStyles({ kind })} />
          ))}
        </span>
        {formatUpdates(kinds.length)}
      </RacButton>
      {description && (
        <span id={descriptionId} hidden>
          {description}
        </span>
      )}
    </>
  );
}
