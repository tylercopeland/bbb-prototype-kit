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
 * Surface and must keep the stage colors: the Tooltip. Popover, Dialog,
 * Sheet, Menu and Toast do not use it; they always render as panels (owner
 * decision 2026-10-24) and wrap their content in `SurfaceProvider` instead.
 * Nothing else writes `data-surface` by hand; lint enforces it.
 */
export function useSurfaceProps(): { 'data-surface'?: 'stage' } {
  const kind = useSurface();
  return kind === 'stage' ? { 'data-surface': 'stage' } : {};
}

export interface SurfaceProviderProps {
  kind: SurfaceKind;
  children?: ReactNode;
}

/**
 * Declares the surface through context alone, with no element of its own.
 * An overlay that always draws as a panel wraps its content in
 * `<SurfaceProvider kind="panel">`, so a Tooltip on its close button renders
 * as a panel tooltip even when the overlay was opened from the stage. To
 * draw the stage itself, use `Surface`.
 */
export function SurfaceProvider({ kind, children }: SurfaceProviderProps) {
  return <SurfaceContext.Provider value={kind}>{children}</SurfaceContext.Provider>;
}

export const surfaceStyles = tv({ base: '' });

export interface SurfaceProps {
  kind: SurfaceKind;
  /** The element to render: a `main` for the room's stage column, so the landmark and the surface are one node. @default 'div' */
  as?: 'div' | 'main' | 'section';
  className?: string;
  children?: ReactNode;
}

/**
 * Declares which surface its children sit on. `kind="stage"` renders
 * `data-surface="stage"`, which switches the tokens to the stage ramp, and
 * provides the kind through context so overlays that portal to <body>
 * (Tooltip) can carry `data-surface` themselves through `useSurfaceProps`.
 */
export function Surface({ kind, as: Tag = 'div', className, children }: SurfaceProps) {
  return (
    <SurfaceContext.Provider value={kind}>
      <Tag data-surface={kind === 'stage' ? 'stage' : undefined} className={surfaceStyles({ className })}>
        {children}
      </Tag>
    </SurfaceContext.Provider>
  );
}
