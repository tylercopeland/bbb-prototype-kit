import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatPeopleCount, SessionHeader } from './SessionHeader';

describe('SessionHeader', () => {
  it('renders the title as the h1, the recording image and the count and clock', () => {
    render(<SessionHeader title="Hack Week: Brazil 2026" recording peopleCount={14} elapsed="29:36" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hack Week: Brazil 2026');
    expect(screen.getByRole('img', { name: 'Recording' })).toHaveTextContent('REC');
    expect(screen.getByText(/14 people/)).toHaveTextContent('14 people · Session time 29:36');
  });

  it('is never a live region (X10)', () => {
    render(<SessionHeader title="Hack Week" recording peopleCount={14} elapsed="29:36" />);
    expect(document.querySelector('[aria-live], [role="status"], [role="alert"], [role="timer"]')).toBeNull();
  });

  it('pluralizes the count and hides REC when not recording', () => {
    render(<SessionHeader title="Hack Week" peopleCount={1} elapsed="0:05" />);
    expect(screen.getByText(/1 person/)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Recording' })).not.toBeInTheDocument();
    expect(formatPeopleCount(0)).toBe('0 people');
    expect(formatPeopleCount(30)).toBe('30 people');
  });

  it('truncates the title and merges a className', () => {
    render(<SessionHeader title="A very long title" peopleCount={2} elapsed="1:00" className="gap-6" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('truncate');
    expect(screen.getByRole('banner')).toHaveClass('gap-6');
    expect(screen.getByRole('banner')).not.toHaveClass('gap-3');
  });
});
