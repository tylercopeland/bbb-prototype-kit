import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoom, selectPollResults } from '../../mocks';
import { PollResults, pollStatusText, pollVisibilityText, type PollResultsProps } from './PollResults';

const room = createRoom();
const base: PollResultsProps = {
  question: room.poll.question,
  results: selectPollResults(room),
  answered: 9,
  eligible: 13,
  phase: 'live',
  shown: false,
};

describe('PollResults', () => {
  it('is a section named Poll results with the status, the question and one row per answer, counts and shares as text', () => {
    render(<PollResults {...base} />);
    const section = screen.getByRole('region', { name: 'Poll results' });
    expect(within(section).getByText('Live · 9 of 13 answered')).toBeInTheDocument();
    expect(within(section).getByRole('heading', { level: 3 })).toHaveTextContent(room.poll.question);
    const rows = within(section).getAllByRole('listitem');
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent('Grey icons for muted6 · 67%, most chosen');
    expect(rows[2]).toHaveTextContent('Hide the mic icon0 · 0%');
    expect(rows[2]).not.toHaveTextContent('most chosen');
    // The top answer is bold as well as blue: a weight cue, not color alone.
    expect(within(rows[0]).getByText('Grey icons for muted')).toHaveClass('font-bold');
    expect(within(rows[1]).getByText('A red badge on everyone')).not.toHaveClass('font-bold');
    // No live region: the room announces answers through the Announcer.
    expect(section.querySelector('[aria-live], [role="status"]')).toBeNull();
  });

  it('says in words who sees the results', () => {
    const { rerender } = render(<PollResults {...base} />);
    expect(
      screen.getByText('Answers are anonymous. Only you see the results until you show them.'),
    ).toBeInTheDocument();
    rerender(<PollResults {...base} shown />);
    expect(
      screen.getByText('Answers are anonymous. Results are shown to everyone on the stage.'),
    ).toBeInTheDocument();
    rerender(<PollResults {...base} anonymous={false} phase="ended" />);
    expect(screen.getByText('Poll closed · 9 of 13 answered')).toBeInTheDocument();
    expect(screen.getByText(/You can see who answered what/)).toBeInTheDocument();
    expect(pollStatusText('ended', 0, 13)).toBe('Poll closed · 0 of 13 answered');
    expect(pollVisibilityText(true, false)).toBe(
      'You can see who answered what. Results are shown to everyone on the stage.',
    );
  });

  it('on the stage: named for everyone, the shares only, and a Hide button that works by click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onHide = vi.fn();
    render(<PollResults {...base} variant="stage" shown onHide={onHide} />);
    const section = screen.getByRole('region', { name: 'Poll results shown to everyone' });
    expect(within(section).getByText('9 of 13 answered · shown to everyone')).toBeInTheDocument();
    expect(within(section).getAllByRole('listitem')[0]).toHaveTextContent(
      'Grey icons for muted67%, most chosen',
    );
    expect(within(section).getAllByRole('listitem')[0]).not.toHaveTextContent('6 ·');
    const hide = within(section).getByRole('button', { name: 'Hide results from everyone' });
    await user.click(hide);
    hide.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onHide).toHaveBeenCalledTimes(3);
    await user.tab();
    expect(hide).not.toHaveFocus();
  });

  it('sizes the bars by share, with nothing filled and nothing top before any answer', () => {
    const fresh = selectPollResults({ ...room, poll: { ...room.poll, votes: [0, 0, 0, 0] } });
    render(<PollResults {...base} results={fresh} answered={0} />);
    const rows = screen.getAllByRole('listitem');
    for (const row of rows) {
      expect(row).toHaveTextContent('0%');
      expect(row).not.toHaveTextContent('most chosen');
      expect(row.querySelectorAll('rect')[1]).toHaveAttribute('width', '0');
    }
    expect(screen.getByText('Live · 0 of 13 answered')).toBeInTheDocument();
  });

  it('handles a poll with no answers to choose from and merges a className', () => {
    render(<PollResults {...base} results={[]} className="mt-2" />);
    expect(screen.getByText('This poll has no answers to choose from.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Poll results' })).toHaveClass('mt-2', 'flex');
  });
});
