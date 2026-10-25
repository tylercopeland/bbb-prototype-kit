import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoom, roomReducer, selectDirectList, type RoomAction } from '../../mocks';
import { DMList } from './DMList';

const threadsFor = (people: 'class' | 'one' | 'longNames', ...actions: RoomAction[]) =>
  selectDirectList(actions.reduce(roomReducer, createRoom({ participants: people })));

function setNameOverflow(button: HTMLElement, scrollWidth: number, clientWidth: number) {
  const name = button.querySelector('span.truncate.font-bold') as HTMLSpanElement;
  Object.defineProperty(name, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(name, 'clientWidth', { value: clientWidth, configurable: true });
}

describe('DMList', () => {
  it('lists conversations newest first as buttons named by name, preview, time and unread count', () => {
    render(<DMList threads={threadsFor('class')} />);
    const rows = screen.getAllByRole('button').filter((b) => b.closest('li'));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAccessibleName(/^Rafaela Monaco Can I share my screen right after Frederick\? 9:06 1 unread$/);
    expect(rows[0]).toHaveClass('bg-surface-sunken');
    expect(rows[1]).toHaveAccessibleName(/^Bruno You: It’s in the Notes panel, right next to Chat 8:52\s*$/);
    expect(rows[1]).not.toHaveClass('bg-surface-sunken');
    expect(screen.getByRole('img', { name: '1 unread' })).toBeInTheDocument();
  });

  it('opens a conversation with Enter and the hint with its People button', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onPickPerson = vi.fn();
    render(<DMList threads={threadsFor('class')} onOpen={onOpen} onPickPerson={onPickPerson} />);
    await user.tab();
    expect(screen.getByRole('button', { name: /^Rafaela Monaco/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledWith('rafaela');
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'People' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onPickPerson).toHaveBeenCalledTimes(1);
  });

  it('says so when there are no conversations, and still points to People in one sentence', () => {
    render(<DMList threads={threadsFor('one')} />);
    expect(screen.getByText('No private conversations yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    const link = screen.getByRole('button', { name: 'People' });
    expect(link).toHaveClass('underline');
    expect(link.closest('p')).toHaveTextContent(/^To start a private chat, pick someone in People\.$/);
  });

  it('shows a just-opened thread without preview or time', () => {
    render(<DMList threads={threadsFor('class', { type: 'openDm', participantId: 'frederick' })} />);
    const row = screen.getByRole('button', { name: 'Frederick Dixon' });
    expect(row).toBeInTheDocument();
    expect(row.querySelector('.tabular-nums')).toBeNull();
  });

  it('shows a cut-off name in a tooltip on focus (D6), and Escape closes it', async () => {
    const user = userEvent.setup();
    render(<DMList threads={threadsFor('longNames')} />);
    const row = screen.getByRole('button', { name: /^Rafaela Monaco de Albuquerque Cavalcanti/ });
    setNameOverflow(row, 400, 200);
    await user.tab();
    expect(row).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Rafaela Monaco de Albuquerque Cavalcanti');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(row).toHaveFocus();
  });

  it('reports each row’s button through rowRef, so the owner can return focus to a thread', () => {
    const rows = new Map<string, HTMLButtonElement | null>();
    const { unmount } = render(<DMList threads={threadsFor('class')} rowRef={(id, el) => rows.set(id, el)} />);
    expect(rows.get('rafaela')).toBe(screen.getByRole('button', { name: /^Rafaela Monaco/ }));
    expect(rows.get('bruno')).toBe(screen.getByRole('button', { name: /^Bruno/ }));
    rows.get('bruno')?.focus();
    expect(screen.getByRole('button', { name: /^Bruno/ })).toHaveFocus();
    unmount();
    expect(rows.get('rafaela')).toBeNull();
  });

  it('merges a className', () => {
    const { container } = render(<DMList threads={[]} className="p-4" />);
    expect(container.firstElementChild).toHaveClass('p-4');
    expect(container.firstElementChild).not.toHaveClass('p-2');
  });
});
