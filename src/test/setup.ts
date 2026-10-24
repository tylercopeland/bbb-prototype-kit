import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toastQueue } from '../components/Toast';

// Vitest runs without globals, so Testing Library cannot register its own cleanup.
// One jsdom is shared across files (vitest.config.ts: `isolate: false`), so
// everything a test can leave on the document is reset here and the run passes
// in any order (`vitest run --sequence.shuffle`).
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  toastQueue.clear();
  delete document.documentElement.dataset.theme;
  // React Aria's own live announcer (menus, toasts) prepends a node to <body>
  // and keeps it. `destroyAnnouncer` is not exported by the installed
  // packages, so the node is removed; React Aria recreates it when needed.
  for (const node of document.querySelectorAll('[data-live-announcer]')) node.remove();
  // A modal overlay marks the rest of the page inert / aria-hidden and locks
  // body scroll; an unmount mid-animation can leave those behind.
  for (const element of [document.body, ...document.body.children]) {
    element.removeAttribute('inert');
    element.removeAttribute('aria-hidden');
    element.removeAttribute('style');
  }
});
