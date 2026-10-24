import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'react-aria-components';
import { ANNOUNCEMENT_LIFETIME, Announcer, useAnnouncer, type Politeness } from './Announcer';

function Speaker({ message, politeness }: { message: string; politeness?: Politeness }) {
  const { announce } = useAnnouncer();
  return <Button onPress={() => announce(message, politeness)}>Say it</Button>;
}

describe('Announcer', () => {
  it('renders an empty polite status and an assertive alert region from mount', () => {
    render(<Announcer />);
    const status = screen.getByRole('status');
    const alert = screen.getByRole('alert');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(status).toBeEmptyDOMElement();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toBeEmptyDOMElement();
    expect(status).toHaveClass('sr-only');
    expect(alert).toHaveClass('sr-only');
  });

  it('announces politely by default', async () => {
    const user = userEvent.setup();
    render(
      <Announcer>
        <Speaker message="Rafaela raised a hand" />
      </Announcer>,
    );
    await user.click(screen.getByRole('button', { name: 'Say it' }));
    expect(screen.getByRole('status')).toHaveTextContent('Rafaela raised a hand');
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('announces assertively when asked', async () => {
    const user = userEvent.setup();
    render(
      <Announcer>
        <Speaker message="Rooms are closing" politeness="assertive" />
      </Announcer>,
    );
    await user.click(screen.getByRole('button', { name: 'Say it' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Rooms are closing');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('re-inserts the text so the same message is announced twice', async () => {
    const user = userEvent.setup();
    render(
      <Announcer>
        <Speaker message="New message from Bruno" />
      </Announcer>,
    );
    const button = screen.getByRole('button', { name: 'Say it' });
    await user.click(button);
    const first = screen.getByRole('status').firstElementChild;
    await user.click(button);
    const second = screen.getByRole('status').firstElementChild;
    expect(second).toHaveTextContent('New message from Bruno');
    expect(second).not.toBe(first);
  });

  it('is a no-op outside a provider', async () => {
    const user = userEvent.setup();
    render(<Speaker message="Nothing happens" />);
    await user.click(screen.getByRole('button', { name: 'Say it' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  describe('with fake timers', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('clears the message after its lifetime', () => {
      render(
        <Announcer>
          <Speaker message="Poll answer received" />
        </Announcer>,
      );
      act(() => screen.getByRole('button', { name: 'Say it' }).click());
      expect(screen.getByRole('status')).toHaveTextContent('Poll answer received');
      act(() => vi.advanceTimersByTime(ANNOUNCEMENT_LIFETIME));
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });
  });
});
