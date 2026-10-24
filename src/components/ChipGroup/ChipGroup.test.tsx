import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip, ChipGroup } from './ChipGroup';

function Subject(props: Partial<React.ComponentProps<typeof ChipGroup>>) {
  return (
    <ChipGroup label="Filter people" labelHidden defaultValue="all" {...props}>
      <Chip value="all" badge={{ count: 14, label: '14 people' }}>
        All
      </Chip>
      <Chip value="hands" badge={{ count: 4, label: '4 people' }}>
        Raised hands
      </Chip>
      <Chip value="low" badge={{ count: 3, label: '3 people' }}>
        Low engagement
      </Chip>
    </ChipGroup>
  );
}

describe('ChipGroup', () => {
  it('is a radio group named by its label, with one checked radio per chip (X8)', () => {
    render(<Subject />);
    const group = screen.getByRole('radiogroup', { name: 'Filter people' });
    const chips = screen.getAllByRole('radio');
    expect(chips).toHaveLength(3);
    expect(chips[0]).toBeChecked();
    expect(chips[1]).not.toBeChecked();
    expect(group).toContainElement(chips[0]);
    // No chip is a toggle button.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('names a chip by its text and badge label', () => {
    render(<Subject />);
    expect(screen.getByRole('radio', { name: 'All 14 people' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Raised hands 4 people' })).toBeInTheDocument();
  });

  it('shows its label when not hidden', () => {
    render(<Subject labelHidden={false} label="Time" />);
    const label = screen.getByText('Time');
    expect(label).not.toHaveClass('sr-only');
    expect(screen.getByRole('radiogroup', { name: 'Time' })).toBeInTheDocument();
  });

  it('moves the check with the arrow keys and reports the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Subject onChange={onChange} />);
    const [all, hands, low] = screen.getAllByRole('radio');
    await user.tab();
    expect(all).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(hands).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('hands');
    await user.keyboard('{ArrowDown}');
    expect(low).toBeChecked();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(all).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('all');
  });

  it('enters and leaves the group with one Tab, on the checked chip', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Subject defaultValue="low" />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Low engagement 3 people' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('checks with Space and a click; Enter and Escape change nothing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Subject onChange={onChange} />);
    const [all, hands] = screen.getAllByRole('radio');
    await user.click(hands);
    expect(hands).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('hands');
    await user.click(all);
    expect(all).toBeChecked();
    all.focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Escape}');
    expect(all).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(2);
    await user.keyboard(' ');
    expect(all).toBeChecked();
  });

  it('marks the checked chip visually with data-selected and the badge inverts', () => {
    render(<Subject />);
    const all = screen.getByRole('radio', { name: 'All 14 people' });
    const chip = all.closest('label');
    expect(chip).toHaveAttribute('data-selected');
    expect(chip).toHaveClass('data-selected:bg-text', 'focus-ring', 'hit-area');
    expect(screen.getByRole('img', { name: '14 people' })).toHaveClass('bg-surface', 'text-text');
    expect(screen.getByRole('img', { name: '4 people' })).toHaveClass('bg-text', 'text-surface');
  });

  it('can be controlled and disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Subject defaultValue={undefined} value="hands" onChange={onChange} />);
    const [all, hands] = screen.getAllByRole('radio');
    expect(hands).toBeChecked();
    await user.click(all);
    expect(onChange).toHaveBeenCalledWith('all');
    expect(hands).toBeChecked();
    rerender(<Subject defaultValue={undefined} value="hands" onChange={onChange} isDisabled />);
    expect(all).toBeDisabled();
    expect(all.closest('label')).toHaveAttribute('data-disabled');
  });

  it('forwards refs to the group and a chip', () => {
    const group = createRef<HTMLDivElement>();
    const chip = createRef<HTMLLabelElement>();
    render(
      <ChipGroup ref={group} label="Time" defaultValue="10">
        <Chip ref={chip} value="10">
          10 min
        </Chip>
      </ChipGroup>,
    );
    expect(group.current).toBe(screen.getByRole('radiogroup'));
    expect(chip.current).toBe(screen.getByRole('radio').closest('label'));
  });

  it('merges a consumer className on a chip', () => {
    render(
      <ChipGroup label="Time" defaultValue="10">
        <Chip value="10" className="h-control-md flex-1 rounded-control">
          10 min
        </Chip>
      </ChipGroup>,
    );
    const chip = screen.getByRole('radio').closest('label');
    expect(chip).toHaveClass('flex-1', 'h-control-md', 'rounded-control');
    expect(chip).not.toHaveClass('h-control-sm', 'rounded-full');
  });
});
