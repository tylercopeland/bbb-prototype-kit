import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertPill } from './AlertPill';

function setLabelOverflow(button: HTMLElement, scrollWidth: number, clientWidth: number) {
  const label = button.querySelector('span.truncate') as HTMLSpanElement;
  Object.defineProperty(label, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(label, 'clientWidth', { value: clientWidth, configurable: true });
}

describe('AlertPill', () => {
  it('is a button whose name is exactly the visible text (D4), described by what it opens', () => {
    render(
      <AlertPill kind="insight" description="Opens People filtered to low engagement">
        3 low engagement
      </AlertPill>,
    );
    const pill = screen.getByRole('button', { name: '3 low engagement' });
    expect(pill).toHaveAccessibleName('3 low engagement');
    expect(pill).toHaveAccessibleDescription('Opens People filtered to low engagement');
    expect(pill).toHaveClass('border-insight');
    expect(pill.querySelector('svg')).toHaveAttribute('data-icon', 'insight');
  });

  it('presses with a click, Enter and Space, after Tab', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <AlertPill kind="hands" onPress={onPress}>
        4 raised
      </AlertPill>,
    );
    const pill = screen.getByRole('button', { name: '4 raised' });
    await user.tab();
    expect(pill).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(pill);
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('shows a cut-off text in a tooltip on focus (D6) and closes it on Escape, keeping focus', async () => {
    const user = userEvent.setup();
    render(
      <AlertPill kind="question" description="Opens Chat">
        Rafaela Monaco de Albuquerque Cavalcanti asked
      </AlertPill>,
    );
    const pill = screen.getByRole('button', { name: 'Rafaela Monaco de Albuquerque Cavalcanti asked' });
    setLabelOverflow(pill, 400, 200);
    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Rafaela Monaco de Albuquerque Cavalcanti asked');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(pill).toHaveFocus();
  });

  it('opens no tooltip when the text fits', async () => {
    const user = userEvent.setup();
    render(<AlertPill kind="hands">4 raised</AlertPill>);
    await user.tab();
    expect(screen.getByRole('button', { name: '4 raised' })).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('forwards its ref and merges a className', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <AlertPill ref={ref} kind="back" className="max-w-full">
        Breakouts ended
      </AlertPill>,
    );
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Breakouts ended' }));
    expect(ref.current).toHaveClass('max-w-full', 'border-status-live');
    expect(ref.current).not.toHaveClass('max-w-64');
  });
});
