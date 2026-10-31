import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomWork, roomWorkLabels } from './RoomWork';

describe('RoomWork', () => {
  it('is an image named by the kind, with the strokes hidden from assistive technology', () => {
    render(<RoomWork kind="quiz" />);
    const img = screen.getByRole('img', { name: 'Practice quiz' });
    expect(img).toBeInTheDocument();
    // The strokes and the label are decoration: the name carries the meaning.
    for (const child of img.children) expect(child).toHaveAttribute('aria-hidden', 'true');
    expect(img.children).toHaveLength(2);
    expect(roomWorkLabels).toEqual({
      board: 'Shared whiteboard',
      doc: 'Shared notes',
      quiz: 'Practice quiz',
      slide: 'Your slides',
    });
  });

  it('keeps the name when the visible label is hidden, and sizes to thumb or full', () => {
    const { rerender } = render(<RoomWork kind="doc" showLabel={false} />);
    expect(screen.getByRole('img', { name: 'Shared notes' })).toHaveClass('p-2');
    expect(screen.queryByText('Shared notes')).not.toBeInTheDocument();
    rerender(<RoomWork kind="doc" size="full" />);
    expect(screen.getByRole('img', { name: 'Shared notes' })).toHaveClass('p-6');
    expect(screen.getByText('Shared notes')).toBeInTheDocument();
  });

  it('is not focusable and takes no Tab stop', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <RoomWork kind="board" />
        <button type="button">after</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'before' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
  });

  it('merges a className onto the root', () => {
    render(<RoomWork kind="slide" className="w-36" />);
    expect(screen.getByRole('img', { name: 'Your slides' })).toHaveClass('w-36');
  });
});
