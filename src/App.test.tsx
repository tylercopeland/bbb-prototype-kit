import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { App } from './App';
import { RoomProvider } from './mocks';
import { artboards, findArtboard } from './routes/artboards';
import { stateForArtboard } from './routes/initialState';
import { Placeholder } from './routes/pages/ArtboardPage';
import { createTestRouter } from './routes/router';
import { screenFor } from './routes/screens';

function renderAt(path: string) {
  return render(<RouterProvider router={createTestRouter(path)} />);
}

describe('App', () => {
  it('renders the artboard index at the root', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BigBlueButton 4.0 prototype');
  });
});

describe('routes', () => {
  it('lists every artboard, grouped Desktop and Mobile, with a link each', () => {
    renderAt('/');
    const desktop = screen.getByRole('region', { name: /Desktop/ });
    const mobile = screen.getByRole('region', { name: /Mobile/ });
    expect(within(desktop).getAllByRole('listitem')).toHaveLength(
      artboards.filter((a) => a.group === 'desktop').length,
    );
    expect(within(mobile).getAllByRole('listitem')).toHaveLength(
      artboards.filter((a) => a.group === 'mobile').length,
    );
    expect(screen.getByRole('link', { name: 'A · Action bar' })).toHaveAttribute(
      'href',
      '/desktop/F1Bar-4roh-l8ju',
    );
    expect(screen.getByRole('link', { name: 'Phone · room (teacher presenting)' })).toHaveAttribute(
      'href',
      '/mobile/MB1Room',
    );
    expect(screen.getByRole('link', { name: 'Design tokens' })).toHaveAttribute('href', '/tokens');
  });

  it('keeps the token sheet at /tokens with its theme toggle', async () => {
    const user = userEvent.setup();
    renderAt('/tokens');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('tokens');
    const toggle = screen.getByRole('button', { name: 'Dark theme' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveTextContent('Dark theme');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  // Every artboard has a screen since milestone 6 batch B, so the placeholder is rendered on its own.
  it('renders an accessible placeholder for an artboard without a screen, with its state', () => {
    const artboard = findArtboard('mobile', 'MB11Slides')!;
    render(
      <RouterProvider
        router={createMemoryRouter([
          {
            path: '/',
            element: (
              <RoomProvider initialState={stateForArtboard(artboard, { people: 'thirty', pfilter: 'low', panel: 'people' })}>
                <Placeholder artboard={artboard} milestone={6} />
              </RoomProvider>
            ),
          },
        ])}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Phone · All slides (grid button)');
    expect(screen.getByText('Not built yet (milestone 6)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the artboards' })).toHaveAttribute('href', '/');
    expect(screen.getByText('People')).toBeInTheDocument();
    // The query overrides the props: thirty people, the People panel filtered to low engagement.
    expect(screen.getByText('30 · 5 hands raised')).toBeInTheDocument();
    expect(screen.getByText('people · filter low')).toBeInTheDocument();
  });

  it('renders the built milestone 4 artboards as the room, not the placeholder', () => {
    renderAt('/desktop/G1People-my6z');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hack Week: Brazil 2026');
    expect(screen.queryByText(/Not built yet/)).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'People' })).toBeInTheDocument();
  });

  it('renders every desktop and every mobile artboard as a screen: no placeholder remains', () => {
    expect(artboards.length).toBeGreaterThan(0);
    for (const a of artboards) expect(screenFor(a).Screen, `${a.group}/${a.stem}`).toBeDefined();
    renderAt('/mobile/MB11Slides');
    expect(screen.getByRole('heading', { level: 1, hidden: true })).toHaveTextContent('Hack Week: Brazil 2026');
    expect(screen.queryByText(/Not built yet/)).not.toBeInTheDocument();
  });

  it('shows the not-found page for an unknown artboard or group', () => {
    renderAt('/desktop/Nope');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('No artboard here');
    renderAt('/tablet/MB1Room');
    expect(screen.getAllByRole('heading', { level: 1 })[1]).toHaveTextContent('No artboard here');
  });

  it('navigates from the index to an artboard and back by link', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('link', { name: 'Phone · Confirm Leave' }));
    // The confirmation is open on this route, so the room's heading is behind it.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hack Week: Brazil 2026', hidden: true }),
    ).toBeInTheDocument();
    // Leaving the session goes back to the index (MB16's confirmation).
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Leave session' }),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'BigBlueButton 4.0 prototype' }),
    ).toBeInTheDocument();
  });
});
