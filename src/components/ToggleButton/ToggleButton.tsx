import { useId, type Ref } from 'react';
import {
  Focusable,
  ToggleButton as RacToggleButton,
  composeRenderProps,
  type ToggleButtonProps as RacToggleButtonProps,
} from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import { useAriaKeyshortcuts, type ShortcutId } from '../../shortcuts';
import { tv, type VariantProps } from '../../styles/tv';
import { Badge, type BadgeProps } from '../Badge';
import { iconSizeFor, type ControlSize } from '../Button';
import { disabledDomProps, iconButtonStyles } from '../IconButton';
import { Tooltip, type TooltipPlacement } from '../Tooltip';

/**
 * The mic and camera pattern (X7): the soft icon square, and `data-selected`
 * swaps it to the selected pair (blue-100 / stage-800 on the stage, exactly
 * the canvas fill) plus the inset `selected-ring`, so the state never rests
 * on color alone. `selectedTone="hand"` turns the selected state amber.
 * Hover and press leave a selected control as it is. `isSpeaking` adds the
 * green ring, the only time green appears on the action bar.
 *
 * It fixes `variant="soft"` and `tone="neutral"`: every toggle on the canvas
 * sits on the soft fill, and the selected and speaking states carry the
 * meaning, so there is nothing for a variant or a danger tone to do.
 */
export const toggleButtonStyles = tv({
  extend: iconButtonStyles,
  base: 'data-selected:selected-ring',
  variants: {
    selectedTone: {
      accent:
        'data-selected:bg-selected data-selected:text-selected-text data-selected:data-hovered:bg-selected data-selected:data-pressed:bg-selected',
      hand: 'data-selected:bg-status-hand data-selected:text-on-status-hand data-selected:selected-ring-hand data-selected:data-hovered:bg-status-hand data-selected:data-pressed:bg-status-hand',
    },
    isSpeaking: {
      true: 'ring-speaking',
    },
  },
  defaultVariants: { variant: 'soft', tone: 'neutral', size: 'touch', selectedTone: 'accent' },
});

export type ToggleButtonSelectedTone = NonNullable<VariantProps<typeof toggleButtonStyles>['selectedTone']>;

/**
 * The count on a panel button (Focus.dc.html 49): over the top-right
 * corner, with a 2px border in the ring-offset color (the stage behind the
 * action bar) so it separates from the button. 24px outside, 20px inside
 * the border.
 */
export const toggleBadgeStyles = tv({
  base: 'absolute -top-1 -right-1 h-6 min-w-6 border-2 border-ring-offset',
});

export interface ToggleButtonProps extends Omit<
  RacToggleButtonProps,
  'className' | 'children' | 'aria-label' | 'isDisabled'
> {
  /** Fixed: "Microphone", "Camera" or "Raise hand". The state is `aria-pressed`, never the name. */
  label: string;
  /** Shown while not selected. */
  icon: IconName;
  /** Shown while selected; the icon may swap, the label never does. @default icon */
  selectedIcon?: IconName;
  /** @default 'touch' */
  size?: ControlSize;
  /** Adds `aria-keyshortcuts` and the key chip in the tooltip. */
  shortcut?: ShortcutId;
  /**
   * Sound is coming through: the green ring, the `speaking` glyph in place
   * of the mic, and a "Speaking" description for assistive technology.
   */
  isSpeaking?: boolean;
  /** `hand` colors the selected state amber, for Raise hand. @default 'accent' */
  selectedTone?: ToggleButtonSelectedTone;
  /** A count over the corner (unread on Chat, raised hands on People). Its label describes the button. */
  badge?: Pick<BadgeProps, 'count' | 'label' | 'tone'>;
  /** @default 'top' */
  tooltipPlacement?: TooltipPlacement;
  /** Disabled toggles stay focusable and hoverable (`aria-disabled`) so their tooltip still names them. */
  isDisabled?: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * An icon toggle on React Aria's ToggleButton. Screen readers hear
 * "Microphone, toggle button, pressed": the label stays fixed and the state
 * is exposed through `isSelected` / `aria-pressed`. While speaking, the
 * button is described by a hidden "Speaking" (not a live region); that
 * description takes the place of the tooltip's shortcut text, which is
 * still available through `aria-keyshortcuts`.
 *
 * It is a two-state control. "Audio not joined" is a third state that is
 * not a prop here: in milestone 4 the action bar renders a "Join audio"
 * button (`icon="audioNotJoined"`) in the mic slot until audio is joined.
 * Do not add a tri-state.
 */
export function ToggleButton({
  label,
  icon,
  selectedIcon,
  size = 'touch',
  shortcut,
  isSpeaking = false,
  selectedTone,
  badge,
  tooltipPlacement,
  isDisabled = false,
  className,
  ref,
  ...props
}: ToggleButtonProps) {
  const buttonRef = useAriaKeyshortcuts<HTMLButtonElement>(shortcut, ref);
  const speakingId = useId();
  const badgeId = useId();
  // Keep a caller's description and add the badge and "Speaking" to it, never replace it.
  const describedBy =
    [props['aria-describedby'], badge ? badgeId : undefined, isSpeaking ? speakingId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const glyphFor = (selected: boolean) => (
    <>
      <Icon
        name={isSpeaking ? 'speaking' : selected ? (selectedIcon ?? icon) : icon}
        size={iconSizeFor(size)}
      />
      {badge && <Badge {...badge} className={toggleBadgeStyles()} />}
    </>
  );
  // The badge's label and "Speaking" describe the button through hidden text
  // (not live regions); a referenced role="img" would read its digits only.
  const status = (
    <>
      {badge && (
        <span id={badgeId} hidden>
          {badge.label}
        </span>
      )}
      {isSpeaking && (
        <span id={speakingId} hidden>
          Speaking
        </span>
      )}
    </>
  );

  if (isDisabled) {
    const selected = props.isSelected ?? props.defaultSelected ?? false;
    return (
      <>
        <Tooltip label={label} labelHidden shortcut={shortcut} placement={tooltipPlacement}>
          <Focusable>
            <button
              {...disabledDomProps(props)}
              type="button"
              ref={buttonRef}
              aria-label={label}
              aria-pressed={selected}
              aria-disabled="true"
              aria-describedby={describedBy}
              data-selected={selected || undefined}
              className={toggleButtonStyles({
                selectedTone,
                size,
                isSpeaking,
                isDisabled: true,
                className,
              })}
            >
              {glyphFor(selected)}
            </button>
          </Focusable>
        </Tooltip>
        {status}
      </>
    );
  }

  return (
    <>
      <Tooltip label={label} labelHidden shortcut={shortcut} placement={tooltipPlacement}>
        <RacToggleButton
          {...props}
          ref={buttonRef}
          aria-label={label}
          aria-describedby={describedBy}
          className={composeRenderProps(className, (cls) =>
            toggleButtonStyles({ selectedTone, size, isSpeaking, className: cls }),
          )}
        >
          {({ isSelected }) => glyphFor(isSelected)}
        </RacToggleButton>
      </Tooltip>
      {status}
    </>
  );
}
