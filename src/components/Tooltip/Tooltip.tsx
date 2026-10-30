import { useMemo, type ContextType, type ReactElement, type ReactNode, type RefObject } from 'react';
import {
  Keyboard,
  Tooltip as RacTooltip,
  TooltipTrigger,
  TooltipTriggerStateContext,
  composeRenderProps,
  type TooltipTriggerComponentProps,
} from 'react-aria-components';
import { formatShortcut, type ShortcutId } from '../../shortcuts';
import { tv } from '../../styles/tv';
import { useSurfaceProps } from '../Surface';

/**
 * Inverted relative to the surface: dark on light panels, white with
 * stage-700 text on the stage (Focus.dc.html `.tipw .tip`, Shell.dc.html
 * line 222). No arrow, no shadow.
 */
export const tooltipStyles = tv({
  base: 'flex max-w-64 items-center gap-2 rounded-md bg-text px-2 py-1 text-sm font-semibold text-surface',
});

/** The key chip: a <kbd> in the tooltip's own color. */
export const tooltipKeyStyles = tv({
  base: 'rounded-xs border border-current px-1 font-sans text-xs font-medium',
});

/** Two steps of the 4px spacing scale: the canvas draws the tip 10px above the control. */
const TOOLTIP_OFFSET = 8;

export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

export interface TooltipProps extends Pick<
  TooltipTriggerComponentProps,
  'delay' | 'closeDelay' | 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDisabled'
> {
  /**
   * The trigger: a focusable React Aria element, or one wrapped in
   * `Focusable`. Leave it out and pass `triggerRef` instead for a control
   * that owns its hover and focus state (a Chip or a Tab, through
   * `useTruncationTooltip`); the tooltip is then controlled by `isOpen`.
   */
  children?: ReactElement;
  /** Without `children`: the element the tooltip is positioned against. */
  triggerRef?: RefObject<Element | null>;
  /** For icon buttons, this equals their `aria-label`. */
  label: ReactNode;
  /**
   * The trigger already has `label` as its accessible name, so hide it from
   * the tooltip's description: assistive technology then hears only the
   * shortcut ("Alt + M") instead of the name twice. IconButton and
   * ToggleButton set this; a plain trigger keeps the label.
   */
  labelHidden?: boolean;
  /** A key from `src/shortcuts.ts`, rendered as a key chip. */
  shortcut?: ShortcutId;
  /** @default 'top' */
  placement?: TooltipPlacement;
  className?: string;
}

/**
 * A tooltip for icon-only controls (X5). Opens on hover after `delay` and
 * at once on keyboard focus; closes on pointer leave after `closeDelay`, on
 * blur, on Escape and on press. Touch never opens it, so the trigger must
 * carry its own `aria-label` and `aria-keyshortcuts`: the tooltip only
 * repeats them.
 *
 * It portals to <body>, so it takes `useSurfaceProps()` to stay on the
 * stage ramp when its trigger is on the stage. Inside an overlay, which
 * always draws as a panel, the overlay's `SurfaceProvider` makes it a
 * panel tooltip.
 */
export function Tooltip({
  children,
  triggerRef,
  label,
  labelHidden = false,
  shortcut,
  placement = 'top',
  delay = 600,
  closeDelay = 100,
  className,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDisabled,
}: TooltipProps) {
  const surfaceProps = useSurfaceProps();
  // Standalone (no trigger element), the tooltip is controlled by `isOpen`. React Aria's
  // Tooltip reads its state from TooltipTriggerStateContext, which only TooltipTrigger
  // provides, so the controlled state is provided here in the same shape.
  const standaloneState = useMemo<NonNullable<ContextType<typeof TooltipTriggerStateContext>>>(
    () => ({
      isOpen: isOpen ?? false,
      open: () => onOpenChange?.(true),
      close: () => onOpenChange?.(false),
      shouldSkipAnimation: false,
    }),
    [isOpen, onOpenChange],
  );
  const tooltip = (
    <RacTooltip
      {...surfaceProps}
      triggerRef={children ? undefined : triggerRef}
      placement={placement}
      offset={TOOLTIP_OFFSET}
      className={composeRenderProps(className, (cls) => tooltipStyles({ className: cls }))}
    >
      <span aria-hidden={labelHidden || undefined}>{label}</span>
      {shortcut && (
        <>
          {' '}
          <Keyboard className={tooltipKeyStyles()}>{formatShortcut(shortcut)}</Keyboard>
        </>
      )}
    </RacTooltip>
  );
  if (!children) {
    return (
      <TooltipTriggerStateContext.Provider value={standaloneState}>
        {tooltip}
      </TooltipTriggerStateContext.Provider>
    );
  }
  return (
    <TooltipTrigger
      delay={delay}
      closeDelay={closeDelay}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isDisabled={isDisabled}
    >
      {children}
      {tooltip}
    </TooltipTrigger>
  );
}
