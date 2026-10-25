import { useEffect, useState } from 'react';
import { ToggleButton } from 'react-aria-components';
import { TokenSheet } from '../../tokens/TokenSheet';
import { RouteLink } from '../RouteLink';

/**
 * The milestone 1 token sheet with its theme toggle, kept at `/tokens` so
 * the foundations stay reviewable next to the room.
 */
export function TokensPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.title = 'Tokens · BigBlueButton 4.0 prototype';
    return () => {
      document.documentElement.dataset.theme = 'light';
    };
  }, [dark]);

  return (
    <main className="mx-auto flex max-w-page flex-col gap-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <RouteLink href="/">Back to the artboards</RouteLink>
          <h1 className="text-xl font-semibold text-text">BigBlueButton 4.0 prototype · tokens</h1>
        </div>
        <ToggleButton
          isSelected={dark}
          onChange={setDark}
          className="hit-area h-control-md rounded-control border border-border-control bg-surface px-4 text-md font-medium text-text focus-ring data-selected:bg-accent data-selected:text-on-accent"
        >
          Dark theme
        </ToggleButton>
      </header>
      <TokenSheet />
    </main>
  );
}
