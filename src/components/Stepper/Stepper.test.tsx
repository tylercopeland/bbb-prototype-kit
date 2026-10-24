import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from './Stepper';

function Subject(props: Partial<React.ComponentProps<typeof Stepper>>) {
  return <Stepper label="Rooms" minValue={2} maxValue={50} defaultValue={4} {...props} />;
}

describe('Stepper', () => {
  it('is a labelled number input between a − and a + button, each named with the field label', () => {
    render(<Subject description="About 3 students per room" />);
    const input = screen.getByRole('textbox', { name: 'Rooms' });
    expect(input).toHaveValue('4');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAccessibleDescription('About 3 students per room');
    const fewer = screen.getByRole('button', { name: 'Fewer Rooms' });
    const more = screen.getByRole('button', { name: 'More Rooms' });
    expect(fewer.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(input.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('steps with the buttons and stops at min and max', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Subject defaultValue={49} onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Rooms' });
    const more = screen.getByRole('button', { name: 'More Rooms' });
    await user.click(more);
    expect(input).toHaveValue('50');
    expect(onChange).toHaveBeenLastCalledWith(50);
    expect(more).toBeDisabled();
    await user.click(more);
    expect(input).toHaveValue('50');
    const fewer = screen.getByRole('button', { name: 'Fewer Rooms' });
    await user.click(fewer);
    expect(input).toHaveValue('49');
    expect(onChange).toHaveBeenLastCalledWith(49);
  });

  it('disables − at the minimum', () => {
    render(<Subject defaultValue={2} />);
    expect(screen.getByRole('button', { name: 'Fewer Rooms' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More Rooms' })).toBeEnabled();
  });

  it('takes typing and the arrow keys in the input, and clamps on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Subject onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Rooms' });
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('5');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(input).toHaveValue('3');
    await user.keyboard('{End}');
    expect(input).toHaveValue('50');
    await user.keyboard('{Home}');
    expect(input).toHaveValue('2');
    await user.clear(input);
    await user.keyboard('120');
    await user.tab();
    expect(input).toHaveValue('50');
    expect(onChange).toHaveBeenLastCalledWith(50);
  });

  it('puts only the input in the tab order (the keyboard steps with the arrow keys), with the focus ring on it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Subject />
        <button type="button">After</button>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Rooms' });
    await user.tab();
    expect(input).toHaveFocus();
    expect(input).toHaveClass('focus-ring');
    expect(input).toHaveAttribute('data-focus-visible');
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Fewer Rooms' })).toHaveAttribute('tabindex', '-1');
  });

  it('presses a focused button with Enter and Space', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const input = screen.getByRole('textbox', { name: 'Rooms' });
    const fewer = screen.getByRole('button', { name: 'Fewer Rooms' });
    const more = screen.getByRole('button', { name: 'More Rooms' });
    fewer.focus();
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('3');
    more.focus();
    await user.keyboard(' ');
    expect(input).toHaveValue('4');
  });

  it('ignores Escape and keeps focus and value', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const input = screen.getByRole('textbox', { name: 'Rooms' });
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('4');
  });

  it('shows a tooltip naming a button on hover', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.pointer({ target: document.body, coords: { x: 0, y: 0 } });
    await user.hover(screen.getByRole('button', { name: 'Fewer Rooms' }));
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Fewer');
  });

  it('takes custom button labels and is controlled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Subject
        defaultValue={undefined}
        value={10}
        onChange={onChange}
        decrementLabel="Remove a room from"
        incrementLabel="Add a room to"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Add a room to Rooms' }));
    expect(onChange).toHaveBeenCalledWith(11);
    expect(screen.getByRole('textbox', { name: 'Rooms' })).toHaveValue('10');
    screen.getByRole('button', { name: 'Remove a room from Rooms' });
  });

  it('is disabled as a whole with isDisabled', () => {
    render(<Subject isDisabled />);
    expect(screen.getByRole('textbox', { name: 'Rooms' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fewer Rooms' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More Rooms' })).toBeDisabled();
  });

  it('forwards its ref to the input and merges a className', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Subject ref={ref} className="gap-4" />);
    const input = screen.getByRole('textbox', { name: 'Rooms' });
    expect(ref.current).toBe(input);
    const root = input.closest('.gap-4');
    expect(root).not.toBeNull();
    expect(root).not.toHaveClass('gap-2');
  });
});
