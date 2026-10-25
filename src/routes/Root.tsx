import { RouterProvider as AriaRouterProvider } from 'react-aria-components';
import { Outlet, useHref, useNavigate } from 'react-router';
import { Announcer } from '../components';

/**
 * The layout every route renders inside: React Aria's router bridge, so its
 * `Link`s navigate client-side, and the one `Announcer` (live regions) at
 * the app root.
 */
export function Root() {
  const navigate = useNavigate();
  return (
    <AriaRouterProvider navigate={(href, options) => void navigate(href, options)} useHref={useHref}>
      <Announcer>
        <Outlet />
      </Announcer>
    </AriaRouterProvider>
  );
}
