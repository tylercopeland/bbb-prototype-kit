import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from './TextField';

describe('TextField', () => {
  it('is a text box named by its visible label', () => {
    render(<TextField label="Room name" />);
    const input = screen.getByRole('textbox', { name: 'Room name' });
    expect(input).toBeInTheDocument();
    expect(screen.getByText('Room name')).not.toHaveClass('sr-only');
  });

  it('keeps the label for assistive technology when it is hidden', () => {
    render(<TextField label="Message everyone" labelHidden placeholder="Message everyone" />);
    const input = screen.getByRole('textbox', { name: 'Message everyone' });
    expect(input).toHaveAttribute('placeholder', 'Message everyone');
    expect(screen.getByText('Message everyone', { selector: 'label' })).toHaveClass('sr-only');
  });

  it('describes the field with its description', () => {
    render(<TextField label="Room name" description="Students see this name" />);
    expect(screen.getByRole('textbox', { name: 'Room name' })).toHaveAccessibleDescription(
      'Students see this name',
    );
  });

  it('shows and links the error only while invalid', () => {
    const { rerender } = render(<TextField label="Room name" errorMessage="Enter a name" />);
    const input = screen.getByRole('textbox', { name: 'Room name' });
    expect(screen.queryByText('Enter a name')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');
    rerender(<TextField label="Room name" errorMessage="Enter a name" isInvalid />);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-invalid');
    expect(input).toHaveAccessibleDescription('Enter a name');
    expect(screen.getByText('Enter a name')).toHaveClass('text-danger-text');
  });

  it('takes typing and reports the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField label="Room name" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Room name' });
    await user.type(input, 'Group A');
    expect(input).toHaveValue('Group A');
    expect(onChange).toHaveBeenLastCalledWith('Group A');
  });

  it('is reached by Tab and shows the focus ring (D2)', async () => {
    const user = userEvent.setup();
    render(<TextField label="Room name" />);
    const input = screen.getByRole('textbox', { name: 'Room name' });
    await user.tab();
    expect(input).toHaveFocus();
    expect(input).toHaveClass('focus-ring');
    expect(input).toHaveAttribute('data-focus-visible');
  });

  it('leaves Enter and Escape to the surrounding form or dialog: no change, focus stays', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField label="Room name" defaultValue="Group A" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Room name' });
    await user.click(input);
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.keyboard('{Escape}');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Group A ');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('can be controlled, disabled and read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<TextField label="Room name" value="Group A" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Room name' });
    await user.type(input, 'B');
    expect(onChange).toHaveBeenCalledWith('Group AB');
    expect(input).toHaveValue('Group A');
    rerender(<TextField label="Room name" value="Group A" onChange={onChange} isDisabled />);
    expect(input).toBeDisabled();
    rerender(<TextField label="Room name" value="Group A" onChange={onChange} isReadOnly />);
    expect(input).toHaveAttribute('readonly');
  });

  it('forwards its ref to the input and merges a className on the root', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField ref={ref} label="Room name" className="gap-2" size="touch" />);
    const input = screen.getByRole('textbox', { name: 'Room name' });
    expect(ref.current).toBe(input);
    expect(input).toHaveClass('h-control-touch');
    expect(input).not.toHaveClass('h-control-lg');
    const root = input.closest('.gap-2');
    expect(root).not.toBeNull();
    expect(root).not.toHaveClass('gap-1');
  });
});
