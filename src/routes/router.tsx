import { createBrowserRouter, createMemoryRouter, type RouteObject } from 'react-router';
import { ArtboardPage } from './pages/ArtboardPage';
import { IndexPage } from './pages/IndexPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TokensPage } from './pages/TokensPage';
import { Root } from './Root';

/**
 * The route table (CLAUDE.md › Routes and state): `/` lists every artboard,
 * `/desktop/:artboard` and `/mobile/:artboard` open one, `/tokens` keeps the
 * milestone 1 token sheet. The artboard list itself is `artboards.json`.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: IndexPage },
      { path: 'tokens', Component: TokensPage },
      { path: ':group/:artboard', Component: ArtboardPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
];

/** Vite's base (`/` or `/bbb-prototype-kit/` on GitHub Pages) without its trailing slash. */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export function createAppRouter() {
  return createBrowserRouter(routes, { basename });
}

/** For tests: the same routes on an in-memory history, opened at `path`. */
export function createTestRouter(path: string) {
  return createMemoryRouter(routes, { initialEntries: [path] });
}
