import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextToggle } from './TextToggle';

describe('TextToggle', () => {
  it('is a toggle button named by its text, with the state as aria-pressed and the label fixed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TextToggle icon="raiseHand" selectedTone="hand" onChange={onChange}>
        Raise hand
      </TextToggle>,
    );
    const toggle = screen.getByRole('button', { name: 'Raise hand' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveTextContent('Raise hand');
    expect(toggle).toHaveAttribute('data-selected');
  });

  it('toggles with Enter and Space from the keyboard and is reached by Tab', async () => {
    const user = userEvent.setup();
    render(<TextToggle>Raise hand</TextToggle>);
    const toggle = screen.getByRole('button', { name: 'Raise hand' });
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('sets aria-keyshortcuts for its shortcut and forwards the ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <TextToggle ref={ref} shortcut="raiseHand">
        Raise hand
      </TextToggle>,
    );
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Raise hand' }));
    expect(ref.current).toHaveAttribute('aria-keyshortcuts', 'Alt+H');
  });

  it('is natively disabled when isDisabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TextToggle isDisabled onChange={onChange}>
        Raise hand
      </TextToggle>,
    );
    const toggle = screen.getByRole('button', { name: 'Raise hand' });
    expect(toggle).toBeDisabled();
    await user.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('merges a consumer className through tv', () => {
    render(<TextToggle className="rounded-full">Raise hand</TextToggle>);
    const toggle = screen.getByRole('button', { name: 'Raise hand' });
    expect(toggle).toHaveClass('rounded-full');
    expect(toggle).not.toHaveClass('rounded-control');
  });
});
