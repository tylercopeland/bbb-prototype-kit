import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'react-aria-components';
import { Surface } from '../Surface';
import { Tooltip } from './Tooltip';

function Subject(props: Partial<React.ComponentProps<typeof Tooltip>>) {
  return (
    <Tooltip label="Microphone" delay={0} closeDelay={0} {...props}>
      <Button aria-label="Microphone">M</Button>
    </Tooltip>
  );
}

describe('Tooltip', () => {
  it('opens on keyboard focus and describes the trigger', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', { name: 'Microphone' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.tab();
    expect(trigger).toHaveFocus();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Microphone');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    expect(trigger).toHaveAccessibleDescription('Microphone');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.tab();
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on hover and closes when the pointer leaves', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', { name: 'Microphone' });
    // React Aria opens on hover only in pointer modality; a pointer move sets it.
    await user.pointer({ target: document.body, coords: { x: 0, y: 0 } });
    await user.hover(trigger);
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await user.unhover(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders the shortcut as a key chip after a space', async () => {
    const user = userEvent.setup();
    render(<Subject shortcut="microphone" />);
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.querySelector('kbd')).toHaveTextContent('Alt + M');
    expect(tooltip).toHaveTextContent('Microphone Alt + M');
  });

  it('describes an icon control by the shortcut only, not its name again', async () => {
    const user = userEvent.setup();
    render(<Subject shortcut="microphone" labelHidden />);
    await user.tab();
    const trigger = screen.getByRole('button', { name: 'Microphone' });
    await screen.findByRole('tooltip');
    expect(trigger).toHaveAccessibleDescription('Alt + M');
  });

  it('carries data-surface when its trigger sits on the stage', () => {
    render(
      <Surface kind="stage">
        <Subject defaultOpen />
      </Surface>,
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-surface', 'stage');
  });

  it('has no data-surface on a panel, and merges a className', () => {
    render(<Subject defaultOpen className="max-w-32" />);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).not.toHaveAttribute('data-surface');
    expect(tooltip).toHaveClass('max-w-32', 'bg-text');
    expect(tooltip).not.toHaveClass('max-w-64');
  });
});
