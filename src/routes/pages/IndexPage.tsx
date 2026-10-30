import { useEffect, useRef } from 'react';
import { useNavigationType } from 'react-router';
import { artboardPath, artboardsIn, groups, groupTitles } from '../artboards';
import { RouteLink } from '../RouteLink';
import { screenFor } from '../screens';

/**
 * `/`: every artboard from `docs/artboards.md`, grouped Desktop and Mobile,
 * linking to its route. The status column says which milestone builds a
 * screen that is still a placeholder. Arriving here by navigation (Leave,
 * a link) moves focus to the heading, so the room's Leave button does not
 * drop focus on `<body>` (WCAG 2.4.3); a direct load leaves focus alone.
 */
export function IndexPage() {
  const navigationType = useNavigationType();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Artboards · BigBlueButton 4.0 prototype';
    if (navigationType !== 'POP') headingRef.current?.focus();
  }, [navigationType]);

  return (
    <main className="mx-auto flex max-w-page flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="rounded-xs text-xl font-semibold text-text focus-ring">
          BigBlueButton 4.0 prototype
        </h1>
        <p className="text-md text-text-secondary">
          One route per artboard of the canvas. Each opens the room in that artboard’s state; query parameters
          override it, for example <code className="font-medium">?people=thirty</code> or{' '}
          <code className="font-medium">?chat=empty</code>.
        </p>
        <p>
          <RouteLink href="/tokens">Design tokens</RouteLink>
        </p>
      </header>
      {groups.map((group) => {
        const list = artboardsIn(group);
        return (
          <section key={group} className="flex flex-col gap-3" aria-labelledby={`group-${group}`}>
            <h2 id={`group-${group}`} className="text-lg font-semibold text-text">
              {groupTitles[group]}{' '}
              <span className="text-md font-regular text-text-muted">· {list.length}</span>
            </h2>
            <ol className="flex flex-col divide-y divide-border">
              {list.map((artboard) => {
                const { milestone, Screen } = screenFor(artboard);
                return (
                  <li key={artboard.stem} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                    <span className="w-6 shrink-0 text-right text-sm text-text-muted tabular-nums">
                      {artboard.number}
                    </span>
                    <RouteLink href={artboardPath(artboard)} className="min-w-0 flex-1">
                      <span className="truncate">{artboard.title}</span>
                    </RouteLink>
                    <span className="text-sm text-text-muted tabular-nums">
                      {artboard.size.width}×{artboard.size.height}
                    </span>
                    <span className="w-36 text-sm text-text-muted">
                      {Screen ? 'Built' : `Not built yet (milestone ${milestone})`}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </main>
  );
}
