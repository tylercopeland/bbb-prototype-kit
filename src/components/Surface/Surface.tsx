import { createContext, useContext, type ReactNode } from 'react';
import { tv } from '../../styles/tv';

export type SurfaceKind = 'panel' | 'stage';

const SurfaceContext = createContext<SurfaceKind>('panel');

/** The surface the nearest `Surface` ancestor declares; `panel` outside one. */
export function useSurface(): SurfaceKind {
  return useContext(SurfaceContext);
}

/**
 * The `data-surface` attribute for an element that portals out of its
 * Surface (Tooltip, later Popover and Dialog): spread it on the portaled
 * element so it keeps the stage colors. Nothing else writes `data-surface`
 * by hand; lint enforces it.
 */
export function useSurfaceProps(): { 'data-surface'?: 'stage' } {
  const kind = useSurface();
  return kind === 'stage' ? { 'data-surface': 'stage' } : {};
}

export const surfaceStyles = tv({ base: '' });

export interface SurfaceProps {
  kind: SurfaceKind;
  className?: string;
  children?: ReactNode;
}

/**
 * Declares which surface its children sit on. `kind="stage"` renders
 * `data-surface="stage"`, which switches the tokens to the stage ramp, and
 * provides the kind through context so overlays that portal to <body>
 * (Tooltip) can carry `data-surface` themselves through `useSurfaceProps`.
 */
export function Surface({ kind, className, children }: SurfaceProps) {
  return (
    <SurfaceContext.Provider value={kind}>
      <div data-surface={kind === 'stage' ? 'stage' : undefined} className={surfaceStyles({ className })}>
        {children}
      </div>
    </SurfaceContext.Provider>
  );
}
