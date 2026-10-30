import { useId, type Ref } from 'react';
import {
  Switch as RacSwitch,
  composeRenderProps,
  type SwitchProps as RacSwitchProps,
} from 'react-aria-components';
import { tv } from '../../styles/tv';

/**
 * The option rows of the breakout setup (Breakout.dc.html 260–266,
 * docs/screenshots/BO2SetupGroups-desk.png): a 48px row with the label on
 * the left, the switch on the right and a hairline under it. The row is
 * one <label> around a hidden checkbox (P5: never a switch nested inside a
 * button), so the whole row is the hit area and the text is the name.
 */
export const switchStyles = tv({
  base: 'group flex min-h-12 cursor-default items-center gap-3 border-b border-border py-1 text-md text-text data-disabled:text-text-muted',
});

export const switchTextStyles = tv({
  slots: {
    body: 'flex min-w-0 flex-1 flex-col',
    label: '',
    description: 'text-xs text-text-muted',
  },
});

/**
 * The track and thumb (Breakout.dc.html 452): the track is border-control
 * off and accent on (both at least 3:1 on the surface), and the thumb moves
 * 16px, so the state is a position as well as a color. The focus ring draws
 * on the track through `group-focus-ring`, since the label holds the focus
 * state. In forced colors, which drop background colors, the track and the
 * thumb opt out through the `forced-colors-track*` and `forced-colors-thumb*`
 * utilities and draw in system colors (Canvas and CanvasText off, Highlight
 * and HighlightText on), so the thumb stays visible and on and off differ.
 */
export const switchTrackStyles = tv({
  slots: {
    track:
      'flex h-6 w-10 shrink-0 items-center rounded-full forced-colors-track bg-border-control p-1 group-focus-ring transition-colors group-data-disabled:bg-border group-data-selected:forced-colors-track-on group-data-selected:bg-accent',
    thumb:
      'size-4 rounded-full forced-colors-thumb bg-surface transition-transform group-data-selected:translate-x-4 group-data-selected:forced-colors-thumb-on group-data-selected:bg-on-accent',
  },
});

export interface SwitchProps extends Omit<RacSwitchProps, 'className' | 'children' | 'style'> {
  /** The row's text and the switch's name. */
  children: string;
  /** A second line under the label. */
  description?: string;
  className?: string;
  ref?: Ref<HTMLLabelElement>;
}

/**
 * A switch row on React Aria's Switch: a checkbox with `role="switch"`,
 * toggled by a click anywhere on the row and by Space (Enter does nothing,
 * as on a native checkbox), reached by Tab. The state is `isSelected` /
 * `onChange`; the label never changes with it. The description is
 * `aria-describedby`, not part of the name.
 */
export function Switch({ children, description, className, ...props }: SwitchProps) {
  const text = switchTextStyles();
  const control = switchTrackStyles();
  const descriptionId = useId();
  const describedBy =
    [props['aria-describedby'], description ? descriptionId : undefined].filter(Boolean).join(' ') ||
    undefined;
  return (
    <RacSwitch
      {...props}
      aria-describedby={describedBy}
      className={composeRenderProps(className, (cls) => switchStyles({ className: cls }))}
    >
      <span className={text.body()}>
        <span className={text.label()}>{children}</span>
        {/* Hidden from the label's name computation, and read back through aria-describedby. */}
        {description && (
          <span id={descriptionId} aria-hidden="true" className={text.description()}>
            {description}
          </span>
        )}
      </span>
      <span aria-hidden="true" className={control.track()}>
        <span className={control.thumb()} />
      </span>
    </RacSwitch>
  );
}
