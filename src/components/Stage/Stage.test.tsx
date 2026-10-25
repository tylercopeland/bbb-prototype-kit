import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoom, selectDeck, selectDisplayNames, selectTileOrder, type ParticipantFixture } from '../../mocks';
import { gridColumns, Stage, type StagePresentation } from './Stage';

const forFixture = (people: ParticipantFixture) => {
  const state = createRoom({ participants: people });
  const deck = selectDeck(state)!;
  const presentation: StagePresentation = {
    deckName: deck.file,
    slideTitle: deck.slides[state.presentation.slideIndex],
    slideNumber: state.presentation.slideIndex + 1,
    slideCount: deck.slides.length,
  };
  return { participants: selectTileOrder(state), names: selectDisplayNames(state), presentation };
};

describe('Stage', () => {
  it('renders the slide, its number and the webcam strip inside a stage surface', () => {
    render(<Stage layout="presentation" {...forFixture('class')} />);
    const section = screen.getByRole('region', { name: 'Presentation' });
    expect(section.closest('[data-surface="stage"]')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('BigBlueButton 4.0, refined');
    expect(screen.getByText('Slide').closest('p')).toHaveTextContent('Slide 3 / 12');
    expect(screen.getByRole('list', { name: 'Webcams' }).querySelectorAll('figure')).toHaveLength(5);
    expect(screen.getByRole('button', { name: '+9 more, show all 14 people' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minimize presentation' })).toBeInTheDocument();
  });

  it('puts the strip above the slide with webcams="top", centred as one block; beside it, the column starts lower', () => {
    const { container, rerender } = render(<Stage layout="presentation" webcams="top" {...forFixture('class')} />);
    const root = container.querySelector('[data-surface="stage"]')!;
    expect(root).toHaveClass('flex-col', 'justify-center', 'items-center', '@container');
    expect(root.firstElementChild).toHaveAttribute('aria-label', 'Webcams');
    expect(screen.getByRole('list', { name: 'Webcams' })).toHaveClass('flex-row');
    expect(screen.getByRole('list', { name: 'Webcams' })).not.toHaveClass('mt-21');
    expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveClass('slide-fit-stacked');
    rerender(<Stage layout="presentation" webcams="side" {...forFixture('class')} />);
    expect(root).toHaveClass('flex-row');
    expect(screen.getByRole('list', { name: 'Webcams' })).toHaveClass('flex-col', 'mt-21');
    expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveClass('slide-fit');
  });

  it('minimized: a grid of everyone plus the presentation tile, with data-driven columns', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<Stage layout="minimized" {...forFixture('class')} onRestore={onRestore} />);
    const grid = screen.getByRole('list', { name: 'Webcams and minimized presentation' });
    expect(grid.querySelectorAll('li')).toHaveLength(15);
    expect(grid).toHaveClass('grid-cols-5');
    expect(screen.getByText('Presentation · 3 / 12')).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restore presentation' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('scales the grid from one person to thirty', () => {
    const { rerender } = render(<Stage layout="minimized" {...forFixture('one')} />);
    expect(screen.getByRole('list').querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByRole('list')).toHaveClass('grid-cols-2');
    rerender(<Stage layout="minimized" {...forFixture('thirty')} />);
    expect(screen.getByRole('list').querySelectorAll('li')).toHaveLength(31);
    expect(screen.getByRole('list')).toHaveClass('grid-cols-8');
    rerender(<Stage layout="grid" {...forFixture('four')} />);
    expect(screen.getByRole('list', { name: 'Webcams' }).querySelectorAll('li')).toHaveLength(4);
    expect(screen.queryByText(/Presentation ·/)).not.toBeInTheDocument();
    expect(gridColumns(0)).toBe(2);
    expect(gridColumns(15)).toBe(5);
    expect(gridColumns(100)).toBe(8);
  });

  it('presenter: tabs switch what everyone sees, and the screen frame replaces the slide', async () => {
    const user = userEvent.setup();
    const onShowingChange = vi.fn();
    const { rerender } = render(
      <Stage
        layout="presenter"
        {...forFixture('class')}
        share={{ kind: 'Entire screen', showing: 'screen' }}
        onShowingChange={onShowingChange}
      />,
    );
    const tabs = screen.getByRole('tablist', { name: 'What everyone sees' });
    expect(tabs).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Entire screen' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Everyone sees your entire screen')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Presentation 3 / 12' }));
    expect(onShowingChange).toHaveBeenCalledWith('slides');
    rerender(
      <Stage layout="presenter" {...forFixture('class')} share={{ kind: 'Entire screen', showing: 'slides' }} />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('BigBlueButton 4.0, refined');
  });

  it('calls onMinimize and onShowAll from their buttons', async () => {
    const user = userEvent.setup();
    const onMinimize = vi.fn();
    const onShowAll = vi.fn();
    render(<Stage layout="presentation" {...forFixture('thirty')} onMinimize={onMinimize} onShowAll={onShowAll} />);
    await user.click(screen.getByRole('button', { name: 'Minimize presentation' }));
    await user.click(screen.getByRole('button', { name: '+25 more, show all 30 people' }));
    expect(onMinimize).toHaveBeenCalledTimes(1);
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });

  it('falls back to the grid when there is no presentation, and merges a className', () => {
    const { participants, names } = forFixture('four');
    const { container } = render(<Stage layout="presentation" participants={participants} names={names} className="p-6" />);
    expect(screen.getByRole('list', { name: 'Webcams' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    const root = container.querySelector('[data-surface="stage"]');
    expect(root).toHaveClass('p-6');
    expect(root).not.toHaveClass('p-3');
  });
});
