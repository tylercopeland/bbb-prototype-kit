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
  it('renders an empty polite status and an assertive alert region from mount, reading additions only', () => {
    render(<Announcer />);
    const status = screen.getByRole('status');
    const alert = screen.getByRole('alert');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'false');
    expect(status).toHaveAttribute('aria-relevant', 'additions');
    expect(status).toBeEmptyDOMElement();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'false');
    expect(alert).toHaveAttribute('aria-relevant', 'additions');
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

  it('appends the same message again as a new node, so it is announced twice', async () => {
    const user = userEvent.setup();
    render(
      <Announcer>
        <Speaker message="New message from Bruno" />
      </Announcer>,
    );
    const button = screen.getByRole('button', { name: 'Say it' });
    await user.click(button);
    const first = screen.getByRole('status').lastElementChild;
    await user.click(button);
    const second = screen.getByRole('status').lastElementChild;
    expect(second).toHaveTextContent('New message from Bruno');
    expect(second).not.toBe(first);
    expect(screen.getByRole('status').children).toHaveLength(2);
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

    it('removes the message after its lifetime', () => {
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

    it('keeps every message of a burst as its own node until each one expires', () => {
      function Burst() {
        const { announce } = useAnnouncer();
        return (
          <Button
            onPress={() => {
              announce('Rafaela raised a hand');
              announce('Bruno raised a hand');
              announce('Timo raised a hand');
            }}
          >
            Burst
          </Button>
        );
      }
      render(
        <Announcer>
          <Burst />
        </Announcer>,
      );
      act(() => screen.getByRole('button', { name: 'Burst' }).click());
      const status = screen.getByRole('status');
      expect(Array.from(status.children, (node) => node.textContent)).toEqual([
        'Rafaela raised a hand',
        'Bruno raised a hand',
        'Timo raised a hand',
      ]);
      act(() => vi.advanceTimersByTime(ANNOUNCEMENT_LIFETIME - 1));
      expect(status.children).toHaveLength(3);
      act(() => vi.advanceTimersByTime(1));
      expect(status).toBeEmptyDOMElement();
    });
  });
});
