import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoom, selectDisplayNames, selectTileOrder, type ParticipantFixture } from '../../mocks';
import { PresentationTile } from '../Stage';
import { WebcamStrip } from './WebcamStrip';

const forFixture = (people: ParticipantFixture) => {
  const state = createRoom({ participants: people });
  return { participants: selectTileOrder(state), names: selectDisplayNames(state) };
};

describe('WebcamStrip', () => {
  it('lists the first five people as tiles and a "+N more" button for the rest', () => {
    render(<WebcamStrip {...forFixture('class')} />);
    const list = screen.getByRole('list', { name: 'Webcams' });
    expect(screen.getAllByRole('figure')).toHaveLength(5);
    expect(list.querySelectorAll('li')).toHaveLength(6);
    // The name starts with the visible text, so "click plus nine more" works (WCAG 2.5.3).
    const more = screen.getByRole('button', { name: '+9 more, show all 14 people' });
    expect(more).toHaveTextContent('+9 more');
    // Speakers first, then the hands by longest wait.
    expect(screen.getAllByRole('figure').map((f) => f.querySelector('figcaption span')?.textContent)).toEqual(
      ['Frederick', 'Bruno', 'Rafaela', 'Cibelle', 'Octavio'],
    );
  });

  it('names the local person "You" and shows no more button when everyone fits', () => {
    render(<WebcamStrip {...forFixture('four')} />);
    expect(screen.getAllByRole('figure')).toHaveLength(4);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('figure', { name: /^You ?,/ })).toBeInTheDocument();
  });

  it('renders an empty list for nobody, one tile for one person, and the remainder for thirty', () => {
    const { rerender } = render(<WebcamStrip participants={[]} names={{}} />);
    expect(screen.getByRole('list', { name: 'Webcams' })).toBeEmptyDOMElement();
    rerender(<WebcamStrip {...forFixture('one')} />);
    expect(screen.getAllByRole('figure')).toHaveLength(1);
    rerender(<WebcamStrip {...forFixture('thirty')} />);
    expect(screen.getByRole('button', { name: '+25 more, show all 30 people' })).toHaveTextContent(
      '+25 more',
    );
  });

  it('tells two Anas apart on the plates (B9)', () => {
    render(<WebcamStrip {...forFixture('duplicateNames')} max={20} />);
    expect(screen.getByRole('figure', { name: /^Ana S\. ?,/ })).toBeInTheDocument();
    expect(screen.getByRole('figure', { name: /^Ana F\. ?,/ })).toBeInTheDocument();
  });

  it('reaches the more button with Tab and reports Enter through onShowAll', async () => {
    const user = userEvent.setup();
    const onShowAll = vi.fn();
    render(<WebcamStrip {...forFixture('class')} onShowAll={onShowAll} />);
    await user.tab();
    expect(screen.getByRole('button', { name: '+9 more, show all 14 people' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });

  it('switches direction and merges a className', () => {
    render(<WebcamStrip {...forFixture('class')} direction="row" className="gap-4" />);
    const list = screen.getByRole('list');
    expect(list).toHaveClass('flex-row', 'gap-4');
    expect(list).not.toHaveClass('flex-col', 'gap-2');
    expect(screen.getByRole('button')).toHaveClass('h-24', 'w-24', 'border-dashed');
  });

  it('lays the grid out in two, three or five columns with 16:9 cells, and the more cell as a full cell', () => {
    const { rerender } = render(<WebcamStrip {...forFixture('class')} direction="grid" max={4} />);
    const list = screen.getByRole('list', { name: 'Webcams' });
    expect(list).toHaveClass('grid', 'grid-cols-2');
    expect(list).not.toHaveClass('flex');
    expect(screen.getAllByRole('figure')).toHaveLength(4);
    expect(screen.getAllByRole('figure')[0]).toHaveClass('aspect-video', 'w-full');
    const more = screen.getByRole('button', { name: '+10 more, show all 14 people' });
    expect(more).toHaveClass('aspect-video', 'w-full', 'border-dashed');
    rerender(<WebcamStrip {...forFixture('class')} direction="grid" columns={3} max={30} />);
    expect(list).toHaveClass('grid-cols-3');
    expect(list).not.toHaveClass('grid-cols-2');
    expect(screen.getAllByRole('figure')).toHaveLength(14);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<WebcamStrip {...forFixture('class')} direction="grid" columns={5} max={30} />);
    expect(list).toHaveClass('grid-cols-5');
    // Columns only shape the grid: the column keeps its flex layout.
    rerender(<WebcamStrip {...forFixture('class')} direction="column" columns={5} />);
    expect(list).toHaveClass('flex-col');
    expect(list).not.toHaveClass('grid-cols-5');
  });

  it('renders the grid for nobody, one person and thirty people', () => {
    const { rerender } = render(<WebcamStrip participants={[]} names={{}} direction="grid" />);
    expect(screen.getByRole('list', { name: 'Webcams' })).toBeEmptyDOMElement();
    rerender(<WebcamStrip {...forFixture('one')} direction="grid" />);
    expect(screen.getAllByRole('figure')).toHaveLength(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<WebcamStrip {...forFixture('thirty')} direction="grid" max={4} />);
    expect(screen.getAllByRole('figure')).toHaveLength(4);
    expect(screen.getByRole('button', { name: '+26 more, show all 30 people' })).toBeInTheDocument();
  });

  it('puts a leading item before the tiles, and it is reached first by Tab', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(
      <WebcamStrip
        {...forFixture('class')}
        direction="grid"
        columns={3}
        max={30}
        aria-label="Webcams and minimized presentation"
        leading={
          <PresentationTile
            variant="button"
            slideTitle="Scalable UI"
            slideNumber={3}
            slideCount={12}
            onRestore={onRestore}
          />
        }
      />,
    );
    const list = screen.getByRole('list', { name: 'Webcams and minimized presentation' });
    const items = list.querySelectorAll(':scope > li');
    expect(items).toHaveLength(15);
    const restore = screen.getByRole('button', { name: 'Presentation · 3 / 12, restore' });
    expect(items[0]).toContainElement(restore);
    expect(items[1].querySelector('figure')).not.toBeNull();
    await user.tab();
    expect(restore).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});
