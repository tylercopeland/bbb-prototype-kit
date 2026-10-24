import { createContext, useContext, type ReactNode } from 'react';

export type SurfaceKind = 'panel' | 'stage';

const SurfaceContext = createContext<SurfaceKind>('panel');

/** The surface the nearest `Surface` ancestor declares; `panel` outside one. */
export function useSurface(): SurfaceKind {
  return useContext(SurfaceContext);
}

export interface SurfaceProps {
  kind: SurfaceKind;
  className?: string;
  children?: ReactNode;
}

/**
 * Declares which surface its children sit on. `kind="stage"` renders
 * `data-surface="stage"`, which switches the tokens to the stage ramp, and
 * provides the kind through context so overlays that portal to <body>
 * (Tooltip) can carry `data-surface` themselves.
 */
export function Surface({ kind, className, children }: SurfaceProps) {
  return (
    <SurfaceContext.Provider value={kind}>
      <div data-surface={kind === 'stage' ? 'stage' : undefined} className={className}>
        {children}
      </div>
    </SurfaceContext.Provider>
  );
}
