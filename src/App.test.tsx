import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider } from 'react-router';
import { App } from './App';
import { artboards } from './routes/artboards';
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

  // MB11 (All slides) is batch B of milestone 6, so it still renders the placeholder.
  it('renders an accessible placeholder for an unbuilt artboard, with its state', () => {
    renderAt('/mobile/MB11Slides');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Phone · All slides (grid button)');
    expect(screen.getByText('Not built yet (milestone 6)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the artboards' })).toHaveAttribute('href', '/');
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('14 · 4 hands raised')).toBeInTheDocument();
    expect(screen.getByText('none · filter all')).toBeInTheDocument();
  });

  it('lets query parameters override the artboard props', () => {
    renderAt('/mobile/MB11Slides?panel=people&pfilter=low&people=thirty');
    expect(screen.getByText('30 · 5 hands raised')).toBeInTheDocument();
    expect(screen.getByText('people · filter low')).toBeInTheDocument();
  });

  it('renders the built milestone 4 artboards as the room, not the placeholder', () => {
    renderAt('/desktop/G1People-my6z');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hack Week: Brazil 2026');
    expect(screen.queryByText(/Not built yet/)).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'People' })).toBeInTheDocument();
  });

  it('marks unbuilt mobile artboards with their milestone, and renders every desktop artboard as a screen', () => {
    renderAt('/mobile/MB11Slides');
    expect(screen.getByText('Not built yet (milestone 6)')).toBeInTheDocument();
    const desktop = artboards.filter((a) => a.group === 'desktop');
    expect(desktop.length).toBeGreaterThan(0);
    for (const a of desktop) expect(screenFor(a).Screen, a.stem).toBeDefined();
    // Milestone 6 batch A: the phone shell, its sheets, the student view and the confirmations.
    const built = artboards.filter((a) => a.group === 'mobile' && screenFor(a).Screen);
    expect(built.map((a) => a.stem)).toEqual([
      'MB1Room',
      'MB2Updates',
      'MB3People',
      'MB4Student',
      'MB5Chat',
      'MB6React',
      'MB7More',
      'MB8Landscape',
      'MB9LandscapePeople',
      'MB10Everyone',
      'MB15Attendee',
      'MB16Confirm',
    ]);
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
    await user.click(screen.getByRole('link', { name: 'Phone · All slides (grid button)' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Phone · All slides (grid button)' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Back to the artboards' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'BigBlueButton 4.0 prototype' }),
    ).toBeInTheDocument();
  });
});
