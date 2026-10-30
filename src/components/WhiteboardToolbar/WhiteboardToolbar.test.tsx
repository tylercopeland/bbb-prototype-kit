import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhiteboardToolbar } from './WhiteboardToolbar';

function Subject(props: Partial<React.ComponentProps<typeof WhiteboardToolbar>>) {
  return <WhiteboardToolbar tool="pen" color="amber" {...props} />;
}

describe('WhiteboardToolbar', () => {
  it('is a group of two radio groups: the tools and the inks, with the current ones checked', () => {
    render(<Subject />);
    const toolbar = screen.getByRole('group', { name: 'Whiteboard tools' });
    const tools = within(toolbar).getByRole('radiogroup', { name: 'Tool' });
    expect(
      within(tools)
        .getAllByRole('radio')
        .map((r) => r.getAttribute('aria-label')),
    ).toEqual(['Select', 'Pen', 'Highlighter', 'Shapes', 'Text', 'Eraser']);
    expect(within(tools).getByRole('radio', { name: 'Pen' })).toBeChecked();
    const inks = within(toolbar).getByRole('radiogroup', { name: 'Ink' });
    expect(
      within(inks)
        .getAllByRole('radio')
        .map((r) => r.getAttribute('aria-label')),
    ).toEqual(['Black', 'Blue', 'Red', 'Green', 'Amber', 'Purple']);
    expect(within(inks).getByRole('radio', { name: 'Amber' })).toBeChecked();
  });

  it('reports a new tool and ink, and nothing for the one already chosen', async () => {
    const user = userEvent.setup();
    const onToolChange = vi.fn();
    const onColorChange = vi.fn();
    render(<Subject onToolChange={onToolChange} onColorChange={onColorChange} />);
    await user.click(screen.getByRole('radio', { name: 'Eraser' }));
    expect(onToolChange).toHaveBeenCalledWith('eraser');
    await user.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(onColorChange).toHaveBeenCalledWith('blue');
    await user.click(screen.getByRole('radio', { name: 'Pen' }));
    expect(onToolChange).toHaveBeenCalledTimes(1);
    // A controlled group keeps the owner's choice until the owner changes it.
    expect(screen.getByRole('radio', { name: 'Pen' })).toBeChecked();
  });

  it('moves within a group with the arrow keys, chooses with Space and Enter, and Tab moves to the inks', async () => {
    const user = userEvent.setup();
    const onToolChange = vi.fn();
    const onColorChange = vi.fn();
    render(<Subject onToolChange={onToolChange} onColorChange={onColorChange} />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Select' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Highlighter' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onToolChange).toHaveBeenLastCalledWith('highlighter');
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onToolChange).toHaveBeenLastCalledWith('shapes');
    await user.tab();
    expect(screen.getByRole('radiogroup', { name: 'Ink' }).contains(document.activeElement)).toBe(true);
    await user.keyboard('{ArrowRight} ');
    expect(onColorChange).toHaveBeenLastCalledWith('blue');
  });

  it('names every button in a tooltip on focus, and Escape closes it without moving focus', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Select');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Select' })).toHaveFocus();
  });

  it('draws each ink as a bordered dot in its token, and merges a className', () => {
    render(<Subject className="mt-4" />);
    expect(screen.getByRole('group', { name: 'Whiteboard tools' })).toHaveClass('mt-4', 'rounded-tile');
    const amber = screen.getByRole('radio', { name: 'Amber' }).firstElementChild;
    expect(amber).toHaveClass('bg-status-hand-text', 'border-border-control');
    const black = screen.getByRole('radio', { name: 'Black' }).firstElementChild;
    expect(black).toHaveClass('bg-on-slide');
  });
});
