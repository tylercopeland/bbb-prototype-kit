import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UNSTABLE_ToastQueue as ToastQueue } from 'react-aria-components';
import { Announcer } from '../Announcer';
import { MIN_TOAST_TIMEOUT, ToastRegion, showToast, type ToastContent } from './Toast';

function setup(ref?: React.Ref<HTMLDivElement>) {
  const queue = new ToastQueue<ToastContent>({ maxVisibleToasts: 3 });
  render(
    <Announcer>
      <ToastRegion queue={queue} ref={ref} />
    </Announcer>,
  );
  return queue;
}

describe('Toast', () => {
  it('renders nothing until a toast is shown, then an alertdialog named by its title in a region named by its count', () => {
    const queue = setup();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    act(() => {
      showToast({ title: 'Recording started', description: 'Everyone sees the red dot.' }, {}, queue);
    });
    expect(screen.getByRole('region', { name: /1 notification/ })).toBeInTheDocument();
    const toast = screen.getByRole('alertdialog', { name: 'Recording started' });
    expect(toast).toHaveAccessibleDescription('Everyone sees the red dot.');
    expect(toast.querySelector('svg')).toHaveAttribute('data-icon', 'info');
  });

  it('announces each new toast politely, and assertively when its content says so', () => {
    const queue = setup();
    act(() => {
      showToast({ title: 'Ana moved to Room 2' }, {}, queue);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Ana moved to Room 2');
    act(() => {
      showToast(
        { title: 'Connection lost', description: 'Reconnecting…', tone: 'danger', politeness: 'assertive' },
        {},
        queue,
      );
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Connection lost. Reconnecting…');
    // React Aria's own role="alert" content wrapper is not used: it would make every toast assertive.
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alertdialog', { name: 'Connection lost' }).querySelector('svg')).toHaveAttribute(
      'data-icon',
      'error',
    );
  });

  it('has a visible close button, reached with Tab and pressed with Enter or Space', async () => {
    const user = userEvent.setup();
    const queue = setup();
    act(() => {
      showToast({ title: 'First' }, {}, queue);
      showToast({ title: 'Second' }, {}, queue);
    });
    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2);
    const first = screen.getByRole('alertdialog', { name: 'First' });
    first.focus();
    await user.tab();
    expect(within(first).getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('alertdialog', { name: 'First' })).not.toBeInTheDocument();
    const second = screen.getByRole('alertdialog', { name: 'Second' });
    within(second).getByRole('button', { name: 'Close' }).focus();
    await user.keyboard(' ');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('does not close on Escape', async () => {
    const user = userEvent.setup();
    const queue = setup();
    act(() => {
      showToast({ title: 'Stays' }, {}, queue);
    });
    screen.getByRole('alertdialog').focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog', { name: 'Stays' })).toBeInTheDocument();
  });

  it('runs the action, then closes the toast', async () => {
    const user = userEvent.setup();
    const queue = setup();
    const onPress = vi.fn();
    act(() => {
      showToast({ title: 'Ana moved to Room 2', action: { label: 'Undo', onPress } }, {}, queue);
    });
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('forwards its ref to the region element', () => {
    const ref = createRef<HTMLDivElement>();
    const queue = setup(ref);
    act(() => {
      showToast({ title: 'Hello' }, {}, queue);
    });
    expect(ref.current).toBe(screen.getByRole('region'));
  });

  describe('timing', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('never auto-dismisses in under five seconds', () => {
      const queue = setup();
      act(() => {
        showToast({ title: 'Quick' }, { timeout: 1000 }, queue);
      });
      act(() => vi.advanceTimersByTime(MIN_TOAST_TIMEOUT - 1));
      expect(screen.getByRole('alertdialog', { name: 'Quick' })).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('stays until dismissed without a timeout, and always with an action', () => {
      const queue = setup();
      act(() => {
        showToast({ title: 'Persistent' }, {}, queue);
        showToast(
          { title: 'With action', action: { label: 'Undo', onPress: () => {} } },
          { timeout: 6000 },
          queue,
        );
      });
      act(() => vi.advanceTimersByTime(60_000));
      expect(screen.getByRole('alertdialog', { name: 'Persistent' })).toBeInTheDocument();
      expect(screen.getByRole('alertdialog', { name: 'With action' })).toBeInTheDocument();
    });
  });
});
