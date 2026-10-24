import { useCallback, useEffect, useMemo, useRef, useState, type Ref, type RefObject } from 'react';
import { useObjectRef } from 'react-aria';

export interface TruncationTooltipResult<T extends Element> {
  /** Put on the label `<span>` with `truncate`; the hook measures it. */
  labelRef: RefObject<HTMLSpanElement | null>;
  /** Put on the control; the tooltip positions against it. Also forwards the consumer's `ref`. */
  triggerRef: RefObject<T | null>;
  /** Whether the tooltip is open: the control is hovered or focused and its label is cut off. */
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Spread on the control (`mergeProps` with the consumer's props): hover and focus ask to open, leaving and blur close. */
  triggerProps: {
    onHoverStart: () => void;
    onHoverEnd: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
}

/**
 * The truncated-label tooltip for a control that React Aria does not treat
 * as a tooltip trigger (a Chip is a `<label>` around a radio, a Tab a
 * `<div role="tab">`). Button has the same behaviour through
 * `TooltipTrigger`; this hook gives the others the same pattern: no
 * observer runs while idle, the control measures its label
 * (`scrollWidth > clientWidth`) when it is hovered or focused, and the
 * tooltip shows the full text only while the label is cut off. Escape
 * closes it. Render `<Tooltip label triggerRef isOpen onOpenChange />`
 * inside the control with the values returned here.
 */
export function useTruncationTooltip<T extends Element>(ref?: Ref<T | null>): TruncationTooltipResult<T> {
  const labelRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useObjectRef<T | null>(ref ?? undefined);
  const interaction = useRef({ hovered: false, focused: false });
  const [isOpen, setOpen] = useState(false);

  const update = useCallback(() => {
    const label = labelRef.current;
    const { hovered, focused } = interaction.current;
    setOpen((hovered || focused) && label !== null && label.scrollWidth > label.clientWidth);
  }, []);

  const triggerProps = useMemo(
    () => ({
      onHoverStart: () => {
        interaction.current.hovered = true;
        update();
      },
      onHoverEnd: () => {
        interaction.current.hovered = false;
        update();
      },
      onFocus: () => {
        interaction.current.focused = true;
        update();
      },
      onBlur: () => {
        interaction.current.focused = false;
        update();
      },
    }),
    [update],
  );

  // Escape closes the tooltip, as it does on a TooltipTrigger, and leaves the control's own key handling alone.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen]);

  return { labelRef, triggerRef, isOpen, onOpenChange: setOpen, triggerProps };
}
