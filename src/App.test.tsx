import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider } from 'react-router';
import { App } from './App';
import { artboards } from './routes/artboards';
import { createTestRouter } from './routes/router';

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
    expect(within(desktop).getAllByRole('listitem')).toHaveLength(artboards.filter((a) => a.group === 'desktop').length);
    expect(within(mobile).getAllByRole('listitem')).toHaveLength(artboards.filter((a) => a.group === 'mobile').length);
    expect(screen.getByRole('link', { name: 'A · Action bar' })).toHaveAttribute('href', '/desktop/F1Bar-4roh-l8ju');
    expect(screen.getByRole('link', { name: 'Phone · room (teacher presenting)' })).toHaveAttribute('href', '/mobile/MB1Room');
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

  it('renders an accessible placeholder for an unbuilt artboard, with its state', () => {
    renderAt('/desktop/G1People-my6z');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('1 · People tab (clicked People)');
    expect(screen.getByText('Not built yet (milestone 4)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the artboards' })).toHaveAttribute('href', '/');
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('14 · 4 hands raised')).toBeInTheDocument();
    expect(screen.getByText('people · filter all')).toBeInTheDocument();
  });

  it('lets query parameters override the artboard props', () => {
    renderAt('/desktop/F1Bar-4roh-l8ju?panel=people&pfilter=low&people=thirty');
    expect(screen.getByText('30 · 5 hands raised')).toBeInTheDocument();
    expect(screen.getByText('people · filter low')).toBeInTheDocument();
  });

  it('marks mobile and milestone 5 artboards with their milestone', () => {
    renderAt('/mobile/MB1Room');
    expect(screen.getByText('Not built yet (milestone 6)')).toBeInTheDocument();
    renderAt('/desktop/BO5LiveGroups-desk');
    expect(screen.getByText('Not built yet (milestone 5)')).toBeInTheDocument();
    expect(screen.getByText('live · 4 rooms')).toBeInTheDocument();
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
    await user.click(screen.getByRole('link', { name: 'A · Action bar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'A · Action bar' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Back to the artboards' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'BigBlueButton 4.0 prototype' })).toBeInTheDocument();
  });
});
