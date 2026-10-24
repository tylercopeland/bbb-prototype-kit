import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleButton } from '../ToggleButton';
import { ToggleGroup } from './ToggleGroup';

function Subject(props: Partial<React.ComponentProps<typeof ToggleGroup>>) {
  return (
    <ToggleGroup label="Whiteboard tools" defaultSelectedKeys={['select']} {...props}>
      <ToggleButton id="select" label="Select" icon="select" size="md" />
      <ToggleButton id="pen" label="Pen" icon="annotate" size="md" />
      <ToggleButton id="text" label="Text" icon="text" size="md" />
    </ToggleGroup>
  );
}

describe('ToggleGroup', () => {
  it('is a radio group of radios in single selection, named by its label', () => {
    render(<Subject />);
    screen.getByRole('radiogroup', { name: 'Whiteboard tools' });
    const tools = screen.getAllByRole('radio');
    expect(tools).toHaveLength(3);
    expect(tools[0]).toHaveAccessibleName('Select');
    expect(tools[0]).toHaveAttribute('aria-checked', 'true');
    expect(tools[1]).toHaveAttribute('aria-checked', 'false');
    expect(tools[0]).not.toHaveAttribute('aria-pressed');
  });

  it('is a toolbar of pressed buttons in multiple selection', () => {
    render(<Subject selectionMode="multiple" defaultSelectedKeys={['select', 'pen']} />);
    screen.getByRole('toolbar', { name: 'Whiteboard tools' });
    const tools = screen.getAllByRole('button');
    expect(tools[0]).toHaveAttribute('aria-pressed', 'true');
    expect(tools[1]).toHaveAttribute('aria-pressed', 'true');
    expect(tools[2]).toHaveAttribute('aria-pressed', 'false');
  });

  it('moves focus with the arrow keys and toggles with Space and Enter', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Subject onSelectionChange={onSelectionChange} />);
    const [select, pen, text] = screen.getAllByRole('radio');
    await user.tab();
    expect(select).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(pen).toHaveFocus();
    // Moving focus does not select.
    expect(select).toHaveAttribute('aria-checked', 'true');
    await user.keyboard(' ');
    expect(pen).toHaveAttribute('aria-checked', 'true');
    expect(select).toHaveAttribute('aria-checked', 'false');
    expect(new Set(onSelectionChange.mock.lastCall?.[0])).toEqual(new Set(['pen']));
    await user.keyboard('{ArrowRight}');
    expect(text).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(text).toHaveAttribute('aria-checked', 'true');
    expect(pen).toHaveAttribute('aria-checked', 'false');
  });

  it('leaves the group with Tab and ignores Escape', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Subject />
        <button type="button">After</button>
      </>,
    );
    const [select] = screen.getAllByRole('radio');
    await user.tab();
    expect(select).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(select).toHaveFocus();
    expect(select).toHaveAttribute('aria-checked', 'true');
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('keeps one tool selected with disallowEmptySelection', async () => {
    const user = userEvent.setup();
    render(<Subject disallowEmptySelection />);
    const [select] = screen.getAllByRole('radio');
    await user.click(select);
    expect(select).toHaveAttribute('aria-checked', 'true');
  });

  it('lets multiple selection press several and release one', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Subject selectionMode="multiple" defaultSelectedKeys={[]} onSelectionChange={onSelectionChange} />,
    );
    const [select, pen] = screen.getAllByRole('button');
    await user.click(select);
    await user.click(pen);
    expect(select).toHaveAttribute('aria-pressed', 'true');
    expect(pen).toHaveAttribute('aria-pressed', 'true');
    await user.click(select);
    expect(select).toHaveAttribute('aria-pressed', 'false');
    expect(new Set(onSelectionChange.mock.lastCall?.[0])).toEqual(new Set(['pen']));
  });

  it('keeps the selected-ring cue on the selected tool', () => {
    render(<Subject />);
    const [select, pen] = screen.getAllByRole('radio');
    expect(select).toHaveAttribute('data-selected');
    expect(select).toHaveClass('data-selected:selected-ring');
    expect(pen).not.toHaveAttribute('data-selected');
  });

  it('disables every tool with isDisabled', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Subject isDisabled onSelectionChange={onSelectionChange} />);
    const [, pen] = screen.getAllByRole('radio');
    expect(pen).toBeDisabled();
    await user.click(pen);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('forwards its ref to the group element and merges a className', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Subject ref={ref} className="gap-2 rounded-lg bg-surface p-1" />);
    const group = screen.getByRole('radiogroup');
    expect(ref.current).toBe(group);
    expect(group).toHaveClass('gap-2', 'rounded-lg', 'bg-surface', 'p-1');
    expect(group).not.toHaveClass('gap-1');
  });
});
