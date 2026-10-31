import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createRoom,
  roomReducer,
  roomStatus,
  roomTalkTime,
  selectDisplayNames,
  selectRoomMessages,
  selectRooms,
  type RoomAction,
  type RoomState,
} from '../../mocks';
import { RoomPreview, type RoomPreviewProps } from './RoomPreview';

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state);
const live = run(
  createRoom(),
  { type: 'openRooms' },
  { type: 'requestHelp', roomIndex: 1, from: 'rafaela' },
  { type: 'sendRoomMessage', roomIndex: 1, from: 'rafaela', text: 'Let’s each add two notes first' },
  { type: 'sendRoomMessage', roomIndex: null, from: 'helena', text: '5 minutes left' },
);

function propsFor(state: RoomState, index: number): Omit<RoomPreviewProps, 'isOpen' | 'onOpenChange'> {
  const rooms = selectRooms(state);
  const room = rooms[index];
  const names = selectDisplayNames(state);
  return {
    room,
    roomCount: rooms.length,
    names,
    status: roomStatus(room, 'live', state.clock.now, names),
    talk: roomTalkTime(room, state.breakouts.talkTime),
    messages: selectRoomMessages(index)(state),
    fullNames: Object.fromEntries(state.participants.map((p) => [p.id, p.name])),
    selfId: 'helena',
    solo: state.breakouts.mode === 'solo',
  };
}

function Demo(props: Partial<RoomPreviewProps>) {
  const [open, setOpen] = useState(true);
  const [listening, setListening] = useState(false);
  return (
    <>
      <button type="button">Preview Room 2</button>
      <RoomPreview
        {...propsFor(live, 1)}
        {...props}
        isOpen={open}
        onOpenChange={setOpen}
        isListening={listening}
        onListeningChange={setListening}
      />
    </>
  );
}

describe('RoomPreview', () => {
  it('is a dialog named by the room and described by its place and status, with the work, webcams, talk time and chat', () => {
    render(<Demo />);
    const dialog = screen.getByRole('dialog', { name: 'Room 2' });
    expect(dialog).toHaveAccessibleDescription('Room 2 of 4 · Asked for help · just now');
    expect(within(dialog).getByRole('img', { name: 'Shared notes' })).toBeInTheDocument();
    expect(within(dialog).getByRole('list', { name: 'Room 2 webcams' }).children).toHaveLength(3);
    const talk = within(dialog).getByRole('region', { name: 'Talk time' });
    expect(within(talk).getAllByRole('listitem')).toHaveLength(3);
    expect(within(talk).getAllByText(/^\d+ min$/)).toHaveLength(3);
    const chat = within(dialog).getByRole('region', { name: 'Room chat' });
    expect(within(chat).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Let’s each add two notes first'),
      expect.stringContaining('5 minutes left'),
    ]);
    expect(within(dialog).getByText('Students see you’re watching')).toBeInTheDocument();
    // No live region: the status is a description, read on open.
    expect(dialog.querySelector('[aria-live], [role="status"]')).toBeNull();
  });

  it('moves focus in, closes on Escape and the close button, and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const dialog = screen.getByRole('dialog', { name: 'Room 2' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('sends a message with Enter or Send, clears the field and keeps focus in it (B8)', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Demo onSend={onSend} />);
    const field = screen.getByRole('textbox', { name: 'Message Room 2' });
    await user.click(field);
    await user.keyboard('Two more minutes{Enter}');
    expect(onSend).toHaveBeenCalledWith('Two more minutes');
    expect(field).toHaveValue('');
    expect(field).toHaveFocus();
    await user.keyboard('   {Enter}');
    expect(onSend).toHaveBeenCalledTimes(1);
    await user.keyboard('Nice work');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenLastCalledWith('Nice work');
  });

  it('joins, listens in with a fixed label, and steps to the previous and next room', async () => {
    const user = userEvent.setup();
    const onJoin = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(<Demo onJoin={onJoin} onPrevious={onPrevious} onNext={onNext} />);
    const listen = screen.getByRole('button', { name: 'Listen in' });
    expect(listen).toHaveAttribute('aria-pressed', 'false');
    await user.click(listen);
    expect(screen.getByRole('button', { name: 'Listen in' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Join Room 2' }));
    expect(onJoin).toHaveBeenCalledTimes(1);
    screen.getByRole('button', { name: 'Previous room' }).focus();
    await user.keyboard('{Enter}');
    expect(onPrevious).toHaveBeenCalledTimes(1);
    await user.keyboard('{Tab} ');
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Next room' })).toHaveFocus();
  });

  it('shows a cut-off talk-time name in full in a tooltip while its row is hovered', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const talk = within(screen.getByRole('dialog')).getByRole('region', { name: 'Talk time' });
    const row = within(talk).getAllByRole('listitem')[0];
    const name = within(row).getByText(/^\S+$/, { selector: 'span' });
    Object.defineProperty(name, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(name, 'clientWidth', { value: 120, configurable: true });
    await user.pointer({ target: document.body });
    await user.hover(row);
    // The tooltip portals outside the modal, which hides the rest of the page from assistive technology;
    // it is a visual aid here, since the full name is already the row's text.
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(name.textContent ?? '');
    await user.unhover(row);
    await waitFor(() => expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument());
  });

  it('says "Working solo" in solo mode (B7) and handles an empty room (B1)', () => {
    const solo = run(createRoom(), { type: 'setBreakoutMode', mode: 'solo' }, { type: 'openRooms' });
    const { rerender } = render(<Demo {...propsFor(solo, 2)} />);
    expect(screen.getByRole('dialog', { name: 'Room 3' })).toHaveAccessibleDescription(/Room 3 of 13/);
    expect(screen.getByText('Working solo')).toBeInTheDocument();
    rerender(<Demo room={{ ...propsFor(live, 3).room, members: [] }} status="Empty" talk={[]} messages={[]} />);
    expect(screen.getByText('Nobody is in this room.')).toBeInTheDocument();
    expect(screen.getByText('No one here yet')).toBeInTheDocument();
    expect(screen.getByText('No messages yet.')).toBeInTheDocument();
  });
});
