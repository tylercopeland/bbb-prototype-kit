import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { decks } from '../../mocks';
import { PresentationControls } from './PresentationControls';

const deck = decks[0];

function Subject(props: Partial<React.ComponentProps<typeof PresentationControls>>) {
  return (
    <div className="group">
      <PresentationControls
        deckName={deck.file}
        slides={deck.slides}
        slideIndex={2}
        tool="pen"
        color="amber"
        {...props}
      />
    </div>
  );
}

describe('PresentationControls', () => {
  it('is a group holding the Slides group, the counter and the whiteboard tools', () => {
    render(<Subject />);
    const root = screen.getByRole('group', { name: 'Presentation controls' });
    const slides = within(root).getByRole('group', { name: 'Slides' });
    expect(within(slides).getByRole('button', { name: 'All slides' })).toBeInTheDocument();
    expect(within(slides).getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
    expect(within(slides).getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
    expect(within(slides).getByText('Slide').parentElement).toHaveTextContent('Slide 3 / 12');
    expect(within(root).getByRole('group', { name: 'Whiteboard tools' })).toBeInTheDocument();
  });

  it('pages with the buttons and disables them at the ends, keeping them named and focusable', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const { rerender } = render(<Subject onPrevious={onPrevious} onNext={onNext} />);
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);

    rerender(<Subject slideIndex={0} onPrevious={onPrevious} />);
    const previous = screen.getByRole('button', { name: 'Previous slide' });
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    previous.focus();
    expect(previous).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPrevious).toHaveBeenCalledTimes(1);

    rerender(<Subject slideIndex={deck.slides.length - 1} />);
    expect(screen.getByRole('button', { name: 'Next slide' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Slide').parentElement).toHaveTextContent('Slide 12 / 12');
  });

  it('is hidden until the slide is hovered or focused, always on touch, and revealed while All slides is open', () => {
    const { rerender } = render(<Subject />);
    const root = screen.getByRole('group', { name: 'Presentation controls' });
    expect(root).toHaveClass(
      'opacity-0',
      'group-hover:opacity-100',
      'group-focus-within:opacity-100',
      'pointer-coarse:opacity-100',
    );
    expect(root).not.toHaveClass('opacity-100');
    rerender(<Subject isRevealed />);
    expect(root).toHaveClass('opacity-100', 'pointer-events-auto');
    rerender(<Subject overviewOpen />);
    expect(root).toHaveClass('opacity-100');
  });

  it('opens All slides from the keyboard, picks a slide, and the choice closes it through the room', async () => {
    const user = userEvent.setup();
    const onOverviewChange = vi.fn();
    const onGoToSlide = vi.fn();
    const { rerender } = render(
      <Subject overviewOpen={false} onOverviewChange={onOverviewChange} onGoToSlide={onGoToSlide} />,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'All slides' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onOverviewChange).toHaveBeenLastCalledWith(true);
    rerender(<Subject overviewOpen onOverviewChange={onOverviewChange} onGoToSlide={onGoToSlide} />);
    const dialog = await screen.findByRole('dialog', { name: 'All slides' });
    await user.click(within(dialog).getByRole('button', { name: 'Go to slide 5: Make state visible' }));
    expect(onGoToSlide).toHaveBeenCalledWith(4);
    rerender(<Subject slideIndex={4} overviewOpen={false} onOverviewChange={onOverviewChange} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'All slides' })).toHaveFocus());
  });

  it('passes the tool and ink changes up, and merges a className', async () => {
    const user = userEvent.setup();
    const onToolChange = vi.fn();
    const onColorChange = vi.fn();
    render(<Subject className="inset-x-6" onToolChange={onToolChange} onColorChange={onColorChange} />);
    expect(screen.getByRole('group', { name: 'Presentation controls' })).toHaveClass('inset-x-6');
    await user.click(screen.getByRole('radio', { name: 'Text' }));
    await user.click(screen.getByRole('radio', { name: 'Green' }));
    expect(onToolChange).toHaveBeenCalledWith('text');
    expect(onColorChange).toHaveBeenCalledWith('green');
  });
});
