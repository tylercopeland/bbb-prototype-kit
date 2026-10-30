import type { ComponentProps } from 'react';
import { ToggleButton as RacToggleButton, composeRenderProps, type Key } from 'react-aria-components';
import type { IconName } from '../../icons';
import type { InkColor, WhiteboardTool } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { ToggleButton } from '../ToggleButton';
import { ToggleGroup } from '../ToggleGroup';
import { Tooltip } from '../Tooltip';

/**
 * The whiteboard tools card (Focus.dc.html 117–124): the tools, a hairline,
 * then the inks, 36px squares with a 4px gap on a floating card with the
 * tile radius and the overlay shadow. The card takes the surface it sits
 * on: over the slide inside the stage it is the dark stage card, as every
 * control inside the stage surface is (milestone 4 decision).
 */
export const whiteboardToolbarStyles = tv({
  slots: {
    root: 'flex items-center gap-1 rounded-tile border border-border bg-surface p-1 shadow-overlay',
    divider: 'mx-1 h-5 shrink-0 border-l border-border',
  },
});

/**
 * One ink swatch: a soft 36px square like a tool. Selected uses the
 * toggle's selected fill and inset ring, never the hue alone.
 */
export const swatchStyles = tv({
  base: 'hit-area flex size-control-md shrink-0 items-center justify-center rounded-control bg-surface-raised focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken data-selected:bg-selected data-selected:selected-ring data-selected:data-hovered:bg-selected data-selected:data-pressed:bg-selected',
});

/**
 * The 16px dot inside a swatch, filled with the ink, with a control border
 * around it so the black ink reads on the dark fill too. Every fill is at
 * least 3:1 on the raised fill in every mode (contrast.json).
 */
export const swatchDotStyles = tv({
  base: 'size-icon-sm rounded-full border border-border-control',
  variants: {
    color: {
      ink: 'bg-on-slide',
      blue: 'bg-accent',
      red: 'bg-danger-text',
      green: 'bg-status-live-text',
      amber: 'bg-status-hand-text',
      purple: 'bg-insight-text',
    },
  },
  defaultVariants: { color: 'ink' },
});

export type SwatchColor = NonNullable<VariantProps<typeof swatchDotStyles>['color']>;

/** The tools in toolbar order, each with its glyph (X6: the pen is `annotate`, the one pencil). */
export const whiteboardTools: ReadonlyArray<{ id: WhiteboardTool; label: string; icon: IconName }> = [
  { id: 'select', label: 'Select', icon: 'select' },
  { id: 'pen', label: 'Pen', icon: 'annotate' },
  { id: 'highlighter', label: 'Highlighter', icon: 'highlighter' },
  { id: 'shapes', label: 'Shapes', icon: 'shapes' },
  { id: 'text', label: 'Text', icon: 'text' },
  { id: 'eraser', label: 'Eraser', icon: 'eraser' },
];

/** The inks in toolbar order. The canvas's orange swatch is `amber`. */
export const inkColors: ReadonlyArray<{ id: InkColor; label: string }> = [
  { id: 'ink', label: 'Black' },
  { id: 'blue', label: 'Blue' },
  { id: 'red', label: 'Red' },
  { id: 'green', label: 'Green' },
  { id: 'amber', label: 'Amber' },
  { id: 'purple', label: 'Purple' },
];

export interface WhiteboardToolbarProps extends Omit<ComponentProps<'div'>, 'children' | 'onChange'> {
  tool: WhiteboardTool;
  color: InkColor;
  onToolChange?: (tool: WhiteboardTool) => void;
  onColorChange?: (color: InkColor) => void;
  className?: string;
}

/**
 * A group named "Whiteboard tools" holding two radio groups: the tool
 * (Select, Pen, Highlighter, Shapes, Text, Eraser) and the ink (Black,
 * Blue, Red, Green, Amber, Purple). Each is a `ToggleGroup` in single
 * selection, so one tool and one ink are always checked, the arrow keys
 * move within a group and Tab moves between them. Every button has a
 * tooltip with its name (X5). Nothing here reads the store: the room
 * passes the state and handles each change.
 */
export function WhiteboardToolbar({
  tool,
  color,
  onToolChange,
  onColorChange,
  className,
  ...props
}: WhiteboardToolbarProps) {
  const styles = whiteboardToolbarStyles();
  const onTool = (keys: Set<Key>) => {
    const next = [...keys][0];
    if (next !== undefined && next !== tool) onToolChange?.(next as WhiteboardTool);
  };
  const onColor = (keys: Set<Key>) => {
    const next = [...keys][0];
    if (next !== undefined && next !== color) onColorChange?.(next as InkColor);
  };
  return (
    <div role="group" aria-label="Whiteboard tools" {...props} className={styles.root({ className })}>
      <ToggleGroup
        label="Tool"
        selectedKeys={new Set([tool])}
        onSelectionChange={onTool}
        disallowEmptySelection
      >
        {whiteboardTools.map((t) => (
          <ToggleButton key={t.id} id={t.id} label={t.label} icon={t.icon} size="md" />
        ))}
      </ToggleGroup>
      <span aria-hidden="true" className={styles.divider()} />
      <ToggleGroup
        label="Ink"
        selectedKeys={new Set([color])}
        onSelectionChange={onColor}
        disallowEmptySelection
      >
        {inkColors.map((c) => (
          <Swatch key={c.id} color={c.id} label={c.label} />
        ))}
      </ToggleGroup>
    </div>
  );
}

interface SwatchProps {
  color: InkColor;
  label: string;
  className?: string;
}

/** One ink in the group: a React Aria ToggleButton named by its ink, with the tooltip every icon-only control has. */
function Swatch({ color, label, className }: SwatchProps) {
  return (
    <Tooltip label={label} labelHidden>
      <RacToggleButton
        id={color}
        aria-label={label}
        className={composeRenderProps(className, (cls) => swatchStyles({ className: cls }))}
      >
        <span aria-hidden="true" className={swatchDotStyles({ color })} />
      </RacToggleButton>
    </Tooltip>
  );
}
