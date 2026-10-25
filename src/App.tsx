import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './routes/router';

/** The app: the router over the artboard routes (src/routes/router.tsx). */
export function App() {
  const [router] = useState(createAppRouter);
  return <RouterProvider router={router} />;
}
