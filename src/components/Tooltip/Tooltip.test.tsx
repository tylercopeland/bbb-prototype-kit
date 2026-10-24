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

  it('renders the shortcut as a key chip', async () => {
    const user = userEvent.setup();
    render(<Subject shortcut="microphone" />);
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    const kbd = tooltip.querySelector('kbd');
    expect(kbd).toHaveTextContent('Alt + M');
    expect(tooltip).toHaveTextContent('MicrophoneAlt + M');
  });

  it('carries data-surface when its trigger sits on the stage', () => {
    render(
      <Surface kind="stage">
        <Subject defaultOpen />
      </Surface>,
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-surface', 'stage');
  });

  it('has no data-surface on a panel', () => {
    render(<Subject defaultOpen />);
    expect(screen.getByRole('tooltip')).not.toHaveAttribute('data-surface');
  });
});
