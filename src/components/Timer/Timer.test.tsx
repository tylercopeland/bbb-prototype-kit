import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timer, timerStatus, timerTone, type TimerProps } from './Timer';

const base: TimerProps = { phase: 'ready', leftSec: 300, durationSec: 300, corner: 'topRight' };

/** Minimize and restore swap the card and the pill, as the store does in the room. */
function Switchable(props: Partial<TimerProps>) {
  const [minimized, setMinimized] = useState(props.minimized ?? false);
  return <Timer {...base} {...props} minimized={minimized} onMinimizedChange={setMinimized} />;
}

describe('Timer', () => {
  it('is a group named Timer with the time as plain text, never a live region (X10)', () => {
    render(<Timer {...base} phase="running" leftSec={222} />);
    const card = screen.getByRole('group', { name: 'Timer' });
    expect(within(card).getByText('3:42')).toBeInTheDocument();
    expect(within(card).getByText('Running')).toBeInTheDocument();
    expect(card.querySelector('[aria-live], [role="status"], [role="timer"], [role="alert"]')).toBeNull();
    expect(within(card).getByText('Everyone sees it')).toBeInTheDocument();
  });

  it('says the state in words next to the ring color, and marks the done card', () => {
    expect(timerTone('running', 200)).toBe('running');
    expect(timerTone('running', 60)).toBe('warn');
    expect(timerTone('running', 10)).toBe('urgent');
    expect(timerTone('done', 0)).toBe('done');
    expect(timerStatus('ready', 300)).toBe('Ready');
    expect(timerStatus('paused', 100)).toBe('Paused');
    expect(timerStatus('running', 7)).toBe('Almost there');
    expect(timerStatus('done', 0)).toBe('Time’s up!');
    const { rerender } = render(<Timer {...base} phase="done" leftSec={0} />);
    expect(screen.getByRole('group', { name: 'Timer' })).toHaveClass('border-status-live-text');
    expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument();
    rerender(<Timer {...base} phase="running" leftSec={5} />);
    expect(screen.getByText('0:05')).toHaveClass('text-danger-text');
    expect(screen.getByText('0:05').closest('.animate-pulse')).toHaveClass('motion-reduce:animate-none');
  });

  it('starts, pauses, resets and adds a minute with a click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onPause = vi.fn();
    const onReset = vi.fn();
    const onAddMinute = vi.fn();
    const { rerender } = render(
      <Timer {...base} onStart={onStart} onPause={onPause} onReset={onReset} onAddMinute={onAddMinute} />,
    );
    const start = screen.getByRole('button', { name: 'Start' });
    await user.click(start);
    start.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onStart).toHaveBeenCalledTimes(3);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: '+1 min' }));
    expect(onAddMinute).toHaveBeenCalledTimes(1);
    rerender(<Timer {...base} phase="running" leftSec={200} onPause={onPause} />);
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('offers the quick times as one radio group (X8) and reports the chosen one in seconds', async () => {
    const user = userEvent.setup();
    const onDurationChange = vi.fn();
    const { rerender } = render(<Timer {...base} onDurationChange={onDurationChange} />);
    const group = screen.getByRole('radiogroup', { name: 'Duration' });
    expect(within(group).getAllByRole('radio')).toHaveLength(4);
    expect(within(group).getByRole('radio', { name: '5 min' })).toBeChecked();
    expect(screen.queryByRole('button', { name: '5 min' })).not.toBeInTheDocument();
    await user.click(within(group).getByRole('radio', { name: '3 min' }));
    expect(onDurationChange).toHaveBeenCalledWith(180);
    within(group).getByRole('radio', { name: '5 min' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onDurationChange).toHaveBeenLastCalledWith(600);
    rerender(<Timer {...base} durationSec={360} leftSec={360} />);
    expect(within(group).queryByRole('radio', { checked: true })).toBeNull();
  });

  it('moves to a corner from a menu of radio items, by keyboard, and marks the current one', async () => {
    const user = userEvent.setup();
    const onCornerChange = vi.fn();
    render(<Timer {...base} onCornerChange={onCornerChange} />);
    const trigger = screen.getByRole('button', { name: 'Move to corner' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items.map((i) => i.textContent)).toEqual(['Top left', 'Top right', 'Bottom left', 'Bottom right']);
    expect(within(menu).getByRole('menuitemradio', { name: 'Top right' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(within(menu).getByRole('menuitemradio', { name: 'Top left' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onCornerChange).toHaveBeenCalledWith('bottomLeft');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    // Escape closes without a choice.
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onCornerChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('minimizes to a pill named with the time, which takes focus, and restores with focus back on Minimize', async () => {
    const user = userEvent.setup();
    render(<Switchable phase="running" leftSec={222} />);
    await user.click(screen.getByRole('button', { name: 'Minimize timer' }));
    const pill = screen.getByRole('button', { name: 'Expand timer, 3:42 left' });
    expect(pill).toHaveFocus();
    expect(screen.queryByRole('group', { name: 'Timer' })).not.toBeInTheDocument();
    expect(pill.querySelector('[aria-live]')).toBeNull();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('group', { name: 'Timer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minimize timer' })).toHaveFocus();
  });

  it('removes from its button and reaches every control by Tab', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<Timer {...base} onRemove={onRemove} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Move to corner' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Minimize timer' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Remove timer' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(screen.getByRole('radio', { name: '5 min' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Start' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '+1 min' })).toHaveFocus();
  });

  it('forwards its ref to the card and to the pill, and merges a className', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(<Timer {...base} ref={ref} className="mt-4" />);
    expect(ref.current).toBe(screen.getByRole('group', { name: 'Timer' }));
    expect(ref.current).toHaveClass('mt-4', 'rounded-panel');
    rerender(<Timer {...base} ref={ref} minimized className="mt-4" />);
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Expand timer, 5:00 left' }));
    expect(ref.current).toHaveClass('mt-4', 'rounded-full');
  });
});
