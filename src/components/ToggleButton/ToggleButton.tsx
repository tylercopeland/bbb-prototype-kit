import {
  ToggleButton as RacToggleButton,
  composeRenderProps,
  type ToggleButtonProps as RacToggleButtonProps,
} from 'react-aria-components';
import { tv, type VariantProps } from 'tailwind-variants';
import { Icon, type IconName } from '../../icons';
import type { ShortcutId } from '../../shortcuts';
import { iconButtonStyles, iconSizeFor, useAriaKeyshortcuts, type IconButtonSize } from '../IconButton';
import { Tooltip, type TooltipPlacement } from '../Tooltip';

/**
 * The mic and camera pattern (X7): the soft icon square, and `data-selected`
 * swaps it to the selected pair (blue-100 / stage-800 on the stage, exactly
 * the canvas fill). `tone="hand"` turns the selected state amber. Hover and
 * press leave a selected control as it is. `isSpeaking` adds the green ring,
 * which is the only time green appears on the action bar.
 */
export const toggleButtonStyles = tv({
  extend: iconButtonStyles,
  variants: {
    tone: {
      neutral:
        'data-selected:bg-selected data-selected:text-selected-text data-selected:data-hovered:bg-selected data-selected:data-pressed:bg-selected',
      hand: 'data-selected:bg-status-hand data-selected:text-on-status-hand data-selected:data-hovered:bg-status-hand data-selected:data-pressed:bg-status-hand',
    },
    isSpeaking: {
      true: 'ring-speaking',
    },
  },
  defaultVariants: { variant: 'soft', tone: 'neutral', size: 'touch' },
});

export type ToggleButtonTone = Extract<VariantProps<typeof toggleButtonStyles>['tone'], 'neutral' | 'hand'>;

export interface ToggleButtonProps extends Omit<
  RacToggleButtonProps,
  'className' | 'children' | 'aria-label' | 'ref'
> {
  /** Fixed: "Microphone", "Camera" or "Raise hand". The state is `aria-pressed`, never the name. */
  label: string;
  /** Shown while not selected. */
  icon: IconName;
  /** Shown while selected; the icon may swap, the label never does. @default icon */
  selectedIcon?: IconName;
  /** @default 'touch' */
  size?: IconButtonSize;
  /** Adds `aria-keyshortcuts` and the key chip in the tooltip. */
  shortcut?: ShortcutId;
  /** The green speaking ring. Only while sound is coming through, so green means one thing everywhere. */
  isSpeaking?: boolean;
  /** `hand` colors the selected state amber, for Raise hand. @default 'neutral' */
  tone?: ToggleButtonTone;
  /** @default 'top' */
  tooltipPlacement?: TooltipPlacement;
  className?: string;
}

/**
 * An icon toggle on React Aria's ToggleButton. Screen readers hear
 * "Microphone, toggle button, pressed": the label stays fixed and the state
 * is exposed through `isSelected` / `aria-pressed`.
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
  tone,
  tooltipPlacement,
  className,
  ...props
}: ToggleButtonProps) {
  const buttonRef = useAriaKeyshortcuts<HTMLButtonElement>(shortcut);
  return (
    <Tooltip label={label} shortcut={shortcut} placement={tooltipPlacement}>
      <RacToggleButton
        {...props}
        ref={buttonRef}
        aria-label={label}
        className={composeRenderProps(className, (cls) =>
          toggleButtonStyles({ tone, size, isSpeaking, className: cls }),
        )}
      >
        {({ isSelected }) => (
          <Icon name={isSelected ? (selectedIcon ?? icon) : icon} size={iconSizeFor(size)} />
        )}
      </RacToggleButton>
    </Tooltip>
  );
}
