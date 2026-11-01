import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createRoom,
  selectDeck,
  selectDisplayNames,
  selectTileOrder,
  type ParticipantFixture,
} from '../../mocks';
import { createRef } from 'react';
import { gridColumns, PresentationTile, Stage, StageSlide, type StagePresentation } from './Stage';

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
    const { container, rerender } = render(
      <Stage layout="presentation" webcams="top" {...forFixture('class')} />,
    );
    const root = container.querySelector('[data-surface="stage"]')!;
    expect(root).toHaveClass('flex-col', 'justify-center', 'items-center', '@container');
    expect(root.firstElementChild).toHaveAttribute('aria-label', 'Webcams');
    expect(screen.getByRole('list', { name: 'Webcams' })).toHaveClass('flex-row');
    expect(screen.getByRole('list', { name: 'Webcams' })).not.toHaveClass('mt-21');
    expect(screen.getByRole('heading', { level: 2 }).closest('.group')).toHaveClass('slide-fit-stacked');
    rerender(<Stage layout="presentation" webcams="side" {...forFixture('class')} />);
    expect(root).toHaveClass('flex-row');
    expect(screen.getByRole('list', { name: 'Webcams' })).toHaveClass('flex-col', 'mt-21');
    expect(screen.getByRole('heading', { level: 2 }).closest('.group')).toHaveClass('slide-fit');
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
    expect(screen.getByText('Your entire screen')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Presentation 3 / 12' }));
    expect(onShowingChange).toHaveBeenCalledWith('slides');
    rerender(
      <Stage
        layout="presenter"
        {...forFixture('class')}
        share={{ kind: 'Entire screen', showing: 'slides' }}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('BigBlueButton 4.0, refined');
  });

  it('calls onMinimize and onShowAll from their buttons', async () => {
    const user = userEvent.setup();
    const onMinimize = vi.fn();
    const onShowAll = vi.fn();
    render(
      <Stage layout="presentation" {...forFixture('thirty')} onMinimize={onMinimize} onShowAll={onShowAll} />,
    );
    await user.click(screen.getByRole('button', { name: 'Minimize presentation' }));
    await user.click(screen.getByRole('button', { name: '+25 more, show all 30 people' }));
    expect(onMinimize).toHaveBeenCalledTimes(1);
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });

  it('falls back to the grid when there is no presentation, and merges a className', () => {
    const { participants, names } = forFixture('four');
    const { container } = render(
      <Stage layout="presentation" participants={participants} names={names} className="p-6" />,
    );
    expect(screen.getByRole('list', { name: 'Webcams' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    const root = container.querySelector('[data-surface="stage"]');
    expect(root).toHaveClass('p-6');
    expect(root).not.toHaveClass('p-3');
  });

  it('draws floating cards in their corner of the overlay layer over the slide, and the title keeps clear of the top right (D1)', () => {
    const { rerender } = render(
      <Stage
        layout="presentation"
        {...forFixture('class')}
        overlays={{ topRight: <p>Poll card</p>, bottomLeft: <p>Timer card</p> }}
      />,
    );
    const layer = screen.getByText('Poll card').parentElement?.parentElement;
    expect(layer).toHaveClass('pointer-events-none', 'grid-cols-2', 'grid-rows-2');
    expect(screen.getByText('Poll card').parentElement).toHaveClass('items-end', 'justify-start');
    expect(screen.getByText('Timer card').parentElement).toHaveClass('items-start', 'justify-end');
    // The layer sits in the slide's fit box, under the chrome row, not over the webcam strip.
    const fit = screen.getByRole('heading', { level: 2 }).closest('.group')?.parentElement;
    expect(fit).toHaveClass('relative');
    expect(fit).toContainElement(layer as HTMLElement);
    expect(screen.getByRole('list', { name: 'Webcams' })).not.toContainElement(layer as HTMLElement);
    expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveClass('pr-96');
    // No overlays: no layer at all.
    rerender(<Stage layout="presentation" {...forFixture('class')} />);
    expect(document.querySelector('.grid-rows-2')).toBeNull();
    // Minimized: the layer sits over the whole stage.
    rerender(
      <Stage layout="minimized" {...forFixture('class')} overlays={{ topRight: <p>Timer card</p> }} />,
    );
    expect(screen.getByText('Timer card')).toBeInTheDocument();
    expect(screen.getByText('Timer card').closest('[data-surface="stage"]')).not.toBeNull();
  });

  describe('PresentationTile variant="button"', () => {
    const tile = (props: Partial<React.ComponentProps<typeof PresentationTile>> = {}) => (
      <ul>
        <PresentationTile
          slideTitle="BigBlueButton 4.0, refined"
          slideNumber={3}
          slideCount={12}
          variant="button"
          {...props}
        />
      </ul>
    );

    it('is one whole-cell button named by its visible plate, with the glyph and thumbnail hidden', () => {
      render(tile());
      const button = screen.getByRole('button', { name: 'Presentation · 3 / 12, restore' });
      expect(button).toHaveClass('absolute', 'inset-0');
      expect(screen.getByText('Presentation · 3 / 12').closest('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.queryByText('BigBlueButton 4.0, refined')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Restore presentation' })).not.toBeInTheDocument();
      expect(button.querySelector('[data-icon="restore"]')).not.toBeNull();
      expect(screen.getByRole('listitem')).toHaveClass('aspect-video');
    });

    it('presses with Enter and Space, reaches by Tab, and forwards its ref to the button', async () => {
      const user = userEvent.setup();
      const onRestore = vi.fn();
      const ref = createRef<HTMLButtonElement>();
      render(tile({ onRestore, ref }));
      const button = screen.getByRole('button', { name: 'Presentation · 3 / 12, restore' });
      expect(ref.current).toBe(button);
      await user.tab();
      expect(button).toHaveFocus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(onRestore).toHaveBeenCalledTimes(2);
      await user.click(button);
      expect(onRestore).toHaveBeenCalledTimes(3);
    });

    it('keeps the tile variant with a separate Restore button and the title in the thumbnail', () => {
      render(tile({ variant: 'tile', className: 'w-60' }));
      expect(screen.getByRole('button', { name: 'Restore presentation' })).toBeInTheDocument();
      expect(screen.getByText('BigBlueButton 4.0, refined')).toBeInTheDocument();
      expect(screen.getByRole('listitem')).toHaveClass('w-60');
    });
  });

  describe('StageSlide', () => {
    const slide = (webcams: React.ComponentProps<typeof StageSlide>['webcams']) => (
      <StageSlide
        deckName="bbb-4-refined.pdf"
        slideTitle="Scalable UI"
        slideNumber={9}
        slideCount={12}
        webcams={webcams}
      >
        <button type="button">Minimize presentation</button>
      </StageSlide>
    );

    it('fills the width at 16:9 with the webcams below, fits by height beside them, and draws its children', () => {
      const { rerender } = render(slide('below'));
      const root = screen.getByRole('heading', { level: 2 }).closest('.group');
      expect(root).toHaveClass('aspect-video', 'w-full', 'p-4', 'bg-slide');
      expect(root).not.toHaveClass('slide-fit', 'p-6');
      // The phone keeps no reserved corner: the title clears only the Minimize button.
      expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveClass('pr-12');
      expect(screen.getByRole('heading', { level: 2 }).parentElement).not.toHaveClass('pr-96');
      expect(screen.getByText('Slide').closest('p')).toHaveTextContent('Slide 9 / 12');
      expect(root).toContainElement(screen.getByRole('button', { name: 'Minimize presentation' }));
      rerender(slide('beside'));
      expect(root).toHaveClass('slide-fit', 'p-4');
      expect(root).not.toHaveClass('aspect-video', 'w-full');
      expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveClass('pr-12');
      rerender(slide('side'));
      expect(root).toHaveClass('slide-fit', 'p-6');
      expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveClass('pr-96');
    });
  });
});
