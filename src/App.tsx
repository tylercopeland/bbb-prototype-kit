import { useEffect, useState } from 'react';
import { ToggleButton } from 'react-aria-components';
import { TokenSheet } from './tokens/TokenSheet';

/**
 * Foundations page: the token sheet with a theme toggle, so the e2e and
 * axe smoke tests have something real to scan. Routes arrive in milestone 4.
 */
export function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text">BigBlueButton 4.0 prototype · tokens</h1>
        <ToggleButton
          isSelected={dark}
          onChange={setDark}
          className="h-control-md rounded-control border border-border-control bg-surface px-4 text-md font-medium text-text focus-ring data-selected:bg-accent data-selected:text-on-accent"
        >
          Dark theme
        </ToggleButton>
      </header>
      <TokenSheet />
    </main>
  );
}
