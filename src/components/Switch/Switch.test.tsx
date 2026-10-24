import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

describe('Switch', () => {
  it('is a switch named by its row text, unchecked by default', () => {
    render(<Switch>Record breakout rooms</Switch>);
    const sw = screen.getByRole('switch', { name: 'Record breakout rooms' });
    expect(sw).not.toBeChecked();
  });

  it('is one label around the input, not a switch inside a button (P5), described by its second line', () => {
    render(<Switch description="Students see the recording later">Record breakout rooms</Switch>);
    const sw = screen.getByRole('switch', { name: 'Record breakout rooms' });
    expect(sw.closest('label')).not.toBeNull();
    expect(sw.closest('button')).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(sw).toHaveAccessibleDescription('Students see the recording later');
  });

  it('toggles on a click anywhere in the row and on Space; Enter does nothing, as on a native checkbox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch onChange={onChange}>Record breakout rooms</Switch>);
    const sw = screen.getByRole('switch');
    await user.click(screen.getByText('Record breakout rooms'));
    expect(sw).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(true);
    sw.focus();
    await user.keyboard(' ');
    expect(sw).not.toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(false);
    await user.keyboard('{Enter}');
    expect(sw).not.toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('keeps its name while the state changes', async () => {
    const user = userEvent.setup();
    render(<Switch>Record breakout rooms</Switch>);
    const sw = screen.getByRole('switch', { name: 'Record breakout rooms' });
    await user.click(sw);
    expect(screen.getByRole('switch', { name: 'Record breakout rooms' })).toBeChecked();
  });

  it('is reached by Tab, marks the row focus-visible for the track ring, and ignores Escape', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch onChange={onChange}>Record breakout rooms</Switch>);
    const sw = screen.getByRole('switch');
    await user.tab();
    expect(sw).toHaveFocus();
    const row = sw.closest('label');
    expect(row).toHaveAttribute('data-focus-visible');
    expect(row).toHaveClass('group');
    expect(row?.querySelector('.group-focus-ring')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(sw).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the on state as a position as well as a color', async () => {
    const user = userEvent.setup();
    render(<Switch>Record breakout rooms</Switch>);
    const row = screen.getByRole('switch').closest('label');
    const thumb = row?.querySelector('.group-data-selected\\:translate-x-4');
    expect(thumb).not.toBeNull();
    expect(row).not.toHaveAttribute('data-selected');
    await user.click(screen.getByRole('switch'));
    expect(row).toHaveAttribute('data-selected');
  });

  it('can be controlled and disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <Switch isSelected onChange={onChange}>
        Record breakout rooms
      </Switch>,
    );
    const sw = screen.getByRole('switch');
    expect(sw).toBeChecked();
    await user.click(sw);
    expect(onChange).toHaveBeenCalledWith(false);
    expect(sw).toBeChecked();
    rerender(
      <Switch isSelected isDisabled onChange={onChange}>
        Record breakout rooms
      </Switch>,
    );
    expect(sw).toBeDisabled();
    expect(sw.closest('label')).toHaveAttribute('data-disabled');
  });

  it('forwards its ref to the row and merges a className', () => {
    const ref = createRef<HTMLLabelElement>();
    render(
      <Switch ref={ref} className="min-h-row border-b-0">
        Record breakout rooms
      </Switch>,
    );
    const row = screen.getByRole('switch').closest('label');
    expect(ref.current).toBe(row);
    expect(row).toHaveClass('min-h-row', 'border-b-0');
    expect(row).not.toHaveClass('min-h-12', 'border-b');
  });
});
