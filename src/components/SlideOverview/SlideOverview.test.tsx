import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { decks } from '../../mocks';
import { SlideOverview } from './SlideOverview';

const deck = decks[0];

function Subject(props: Partial<React.ComponentProps<typeof SlideOverview>>) {
  return <SlideOverview deckName={deck.file} slides={deck.slides} currentIndex={2} {...props} />;
}

describe('SlideOverview', () => {
  it('is a closed "All slides" trigger that opens a dialog listing every slide, the current one marked', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const trigger = screen.getByRole('button', { name: 'All slides' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'All slides' });
    expect(within(dialog).getByText('bbb-4-refined.pdf · 12 slides')).toBeInTheDocument();
    const list = within(dialog).getByRole('list', { name: 'Slides' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(12);
    const current = within(list).getByRole('button', { name: 'Go to slide 3: BigBlueButton 4.0, refined' });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current.querySelector('.selected-ring')).not.toBeNull();
    expect(
      within(list).getByRole('button', { name: 'Go to slide 1: Hack Week: Brazil 2026' }),
    ).not.toHaveAttribute('aria-current');
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('reports the picked slide by its zero-based index', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<Subject defaultOpen onPick={onPick} />);
    await user.click(screen.getByRole('button', { name: 'Go to slide 7: Fix the dead ends' }));
    expect(onPick).toHaveBeenCalledWith(6);
  });

  it('opens from the keyboard, moves through the slides with Tab, and Escape returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.tab();
    const trigger = screen.getByRole('button', { name: 'All slides' });
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Go to slide 1: Hack Week: Brazil 2026' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('is controlled by the room: closing it after a pick returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Subject isOpen onOpenChange={onOpenChange} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    rerender(<Subject isOpen={false} onOpenChange={onOpenChange} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('scales from an empty deck to thirty slides', () => {
    const { rerender } = render(<Subject defaultOpen slides={[]} currentIndex={0} deckName="empty.pdf" />);
    expect(screen.getByText('empty.pdf · 0 slides')).toBeInTheDocument();
    expect(screen.getByText('This deck has no slides.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    const thirty = Array.from({ length: 30 }, (_, i) => `Slide ${i + 1}`);
    rerender(<Subject defaultOpen slides={thirty} currentIndex={29} deckName="long.pdf" />);
    expect(within(screen.getByRole('list', { name: 'Slides' })).getAllByRole('listitem')).toHaveLength(30);
    expect(screen.getByRole('button', { name: 'Go to slide 30: Slide 30' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    rerender(<Subject defaultOpen slides={['Only one']} currentIndex={0} deckName="one.pdf" />);
    expect(screen.getByText('one.pdf · 1 slide')).toBeInTheDocument();
  });

  it('forwards its ref to the trigger and merges a className onto it', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Subject ref={ref} className="ml-2" />);
    const trigger = screen.getByRole('button', { name: 'All slides' });
    expect(ref.current).toBe(trigger);
    expect(trigger).toHaveClass('ml-2');
  });
});
