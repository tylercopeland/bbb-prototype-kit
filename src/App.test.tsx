import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('App', () => {
  it('renders the token sheet heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('tokens');
  });

  it('keeps the theme toggle label fixed and exposes its state', async () => {
    const user = userEvent.setup();
    render(<App />);
    const toggle = screen.getByRole('button', { name: 'Dark theme' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveTextContent('Dark theme');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
