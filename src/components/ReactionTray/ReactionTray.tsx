import type { ComponentProps } from 'react';
import { Button as RacButton } from 'react-aria-components';
import { reactionKinds, reactions } from '../../mocks/reactions';
import type { ReactionKind } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { Tooltip } from '../Tooltip';

/** The tray's row of six (Mobile.dc.html 106–107, shared with desktop): 44px round buttons, 4px apart. */
export const reactionTrayStyles = tv({
  base: 'flex items-center gap-1',
});

export const reactionButtonStyles = tv({
  base: 'hit-area flex size-control-touch shrink-0 items-center justify-center rounded-full bg-surface-raised text-xl focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
});

export interface ReactionTrayProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Called with the chosen reaction; the room sends it to the store (D5). */
  onReact?: (kind: ReactionKind) => void;
  className?: string;
}

/**
 * A group named "Reactions" of six buttons, each named by its reaction
 * ("Thumbs up") with the emoji hidden from assistive technology and a
 * tooltip repeating the name (X5). The Popover around it belongs to the
 * action bar's React button.
 */
export function ReactionTray({ onReact, className, ...props }: ReactionTrayProps) {
  return (
    <div role="group" aria-label="Reactions" {...props} className={reactionTrayStyles({ className })}>
      {reactionKinds.map((kind) => (
        <Tooltip key={kind} label={reactions[kind].label} labelHidden>
          <RacButton
            aria-label={reactions[kind].label}
            onPress={() => onReact?.(kind)}
            className={reactionButtonStyles()}
          >
            <span aria-hidden="true">{reactions[kind].emoji}</span>
          </RacButton>
        </Tooltip>
      ))}
    </div>
  );
}
