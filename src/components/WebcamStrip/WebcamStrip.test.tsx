import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoom, selectDisplayNames, selectTileOrder, type ParticipantFixture } from '../../mocks';
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
    expect(screen.getAllByRole('figure').map((f) => f.querySelector('figcaption span')?.textContent)).toEqual([
      'Frederick',
      'Bruno',
      'Rafaela',
      'Cibelle',
      'Octavio',
    ]);
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
    expect(screen.getByRole('button', { name: '+25 more, show all 30 people' })).toHaveTextContent('+25 more');
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
});
