import { useEffect } from 'react';
import { RouteLink } from '../RouteLink';

/** An unknown route: the index lists every artboard. */
export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Not found · BigBlueButton 4.0 prototype';
  }, []);
  return (
    <main className="mx-auto flex max-w-page flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-text">No artboard here</h1>
      <p className="text-md text-text-secondary">
        Routes are <code className="font-medium">/desktop/&lt;artboard&gt;</code> and{' '}
        <code className="font-medium">/mobile/&lt;artboard&gt;</code>, named by the file stem in{' '}
        <code className="font-medium">docs/artboards.md</code>.
      </p>
      <RouteLink href="/">Back to the artboards</RouteLink>
    </main>
  );
}
