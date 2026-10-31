import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createRoom,
  roomReducer,
  roomStatus,
  selectDisplayNames,
  selectRooms,
  type RoomAction,
  type RoomState,
} from '../../mocks';
import { RoomCard, formatMembers, roomStatusTone } from './RoomCard';

const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce(roomReducer, state);
const setup = createRoom();
const live = run(setup, { type: 'openRooms' }, { type: 'requestHelp', roomIndex: 1, from: 'rafaela' });
const names = selectDisplayNames(setup);
const rooms = selectRooms(setup);
const liveRooms = selectRooms(live);
const targets = rooms.map((r) => ({ index: r.index, name: r.name, count: r.members.length }));

function Setup(props: { onMove?: (id: string, room: number) => void }) {
  const [moving, setMoving] = useState<string | null>(null);
  return (
    <ul>
      <RoomCard
        room={rooms[0]}
        names={names}
        variant="setup"
        moveTargets={targets}
        movingId={moving}
        onMoveMenuOpenChange={(id, open) => setMoving(open ? id : null)}
        onMove={props.onMove}
      />
    </ul>
  );
}

describe('RoomCard', () => {
  it('names the room "Room N" as a heading in every variant (B7) and counts its students', () => {
    const { rerender } = render(
      <ul>
        <RoomCard room={rooms[0]} names={names} variant="setup" />
      </ul>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Room 1' })).toBeInTheDocument();
    expect(screen.getByText('4 students')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Room 1 students' })).toBeInTheDocument();
    rerender(
      <ul>
        <RoomCard room={liveRooms[0]} names={names} variant="live" status="Ana and Bruno are talking" />
      </ul>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Room 1' })).toBeInTheDocument();
    expect(screen.getByText('Ana and Bruno are talking')).toBeInTheDocument();
    expect(formatMembers(0)).toBe('Empty');
    expect(formatMembers(1)).toBe('1 student');
    expect(formatMembers(3)).toBe('3 students');
  });

  it('shows an empty room as an empty state, never crashing (B1)', () => {
    const { rerender } = render(
      <ul>
        <RoomCard room={{ ...rooms[0], members: [] }} names={names} variant="setup" />
      </ul>,
    );
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText(/No students yet/)).toBeInTheDocument();
    rerender(
      <ul>
        <RoomCard room={{ ...liveRooms[0], members: [] }} names={names} variant="live" status="Empty" />
      </ul>,
    );
    expect(screen.getByRole('button', { name: 'Preview Room 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join Room 1' })).toBeInTheDocument();
  });

  it('opens a "Move to…" menu on each student by keyboard, with the current room disabled, and reports the choice (B2)', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Setup onMove={onMove} />);
    const chip = screen.getByRole('button', { name: 'Move Bruno to another room' });
    expect(within(chip).getByText('Bruno')).toBeInTheDocument();
    chip.focus();
    await user.keyboard('{Enter}');
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveAccessibleName('Move Bruno to another room');
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual([
      'Room 1Current room',
      'Room 23 students',
      'Room 33 students',
      'Room 43 students',
    ]);
    expect(items[0]).toHaveAttribute('aria-disabled', 'true');
    expect(chip).toHaveAttribute('aria-expanded', 'true');
    // Focus opens on the first enabled room (Room 2); two steps down is Room 4.
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onMove).toHaveBeenCalledWith('bruno', 3);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(chip).toHaveFocus());
    // Escape leaves without a move and keeps focus on the student.
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onMove).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(chip).toHaveFocus());
  });

  it('tells two Anas apart on the chips (B9), and each chip’s label contains the name it shows', () => {
    const twoAnas = createRoom({ participants: 'duplicateNames' });
    const anaNames = selectDisplayNames(twoAnas);
    const roomsWithAnas = selectRooms(twoAnas);
    render(
      <ul>
        {roomsWithAnas.map((r) => (
          <RoomCard
            key={r.index}
            room={r}
            names={anaNames}
            variant="setup"
            moveTargets={targets}
            onMove={() => undefined}
          />
        ))}
      </ul>,
    );
    expect(screen.getByRole('button', { name: 'Move Ana S. to another room' })).toHaveTextContent('Ana S.');
    expect(screen.getByRole('button', { name: 'Move Ana F. to another room' })).toHaveTextContent('Ana F.');
    expect(screen.queryByRole('button', { name: /Ana Souza/ })).not.toBeInTheDocument();
  });

  it('shows a cut-off name in full in a tooltip while the chip is focused, and not when it fits', async () => {
    const user = userEvent.setup();
    const long = createRoom({ participants: 'longNames' });
    const longNames = selectDisplayNames(long);
    const longRooms = selectRooms(long);
    const longest = long.participants.reduce((a, b) => (b.name.length > a.name.length ? b : a));
    const room = longRooms.find((r) => r.members.some((m) => m.id === longest.id))!;
    render(
      <ul>
        <RoomCard room={room} names={longNames} variant="setup" moveTargets={targets} onMove={() => undefined} />
      </ul>,
    );
    const name = longNames[longest.id];
    const chip = screen.getByRole('button', { name: `Move ${name} to another room` });
    const label = within(chip).getByText(name);
    // jsdom has no layout: fake a cut-off label, then one that fits.
    Object.defineProperty(label, 'scrollWidth', { value: 300, configurable: true });
    Object.defineProperty(label, 'clientWidth', { value: 120, configurable: true });
    act(() => chip.focus());
    expect(chip).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(name);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    Object.defineProperty(label, 'scrollWidth', { value: 120, configurable: true });
    act(() => chip.blur());
    act(() => chip.focus());
    expect(chip).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('solo cards show the student, not a menu, and keep the same preview and join actions live (B7)', () => {
    const solo = run(setup, { type: 'setBreakoutMode', mode: 'solo' });
    const { rerender } = render(
      <ul>
        <RoomCard room={selectRooms(solo)[0]} names={names} variant="setup" density="compact" />
      </ul>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Room 1' })).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const soloLive = run(solo, { type: 'openRooms' });
    rerender(
      <ul>
        <RoomCard
          room={selectRooms(soloLive)[0]}
          names={names}
          variant="live"
          density="compact"
          status="Typing in notes"
        />
      </ul>,
    );
    expect(screen.getByRole('button', { name: 'Preview Room 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join Room 1' })).toBeInTheDocument();
  });

  it('previews from the thumbnail, joins, and says help and "You’re here" in words', async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    const onJoin = vi.fn();
    const previewRef = createRef<HTMLButtonElement>();
    const status = roomStatus(liveRooms[1], 'live', live.clock.now, names);
    const { rerender } = render(
      <ul>
        <RoomCard
          room={liveRooms[1]}
          names={names}
          variant="live"
          status={status}
          onPreview={onPreview}
          onJoin={onJoin}
          previewRef={previewRef}
        />
      </ul>,
    );
    const preview = screen.getByRole('button', { name: 'Preview Room 2' });
    expect(previewRef.current).toBe(preview);
    expect(screen.getByText('Asked for help · just now')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('border-status-hand');
    expect(roomStatusTone(liveRooms[1], 'live')).toBe('help');
    expect(roomStatusTone(liveRooms[0], 'live')).toBe('live');
    expect(roomStatusTone(liveRooms[2], 'live')).toBe('neutral');
    expect(roomStatusTone(liveRooms[2], 'back')).toBe('live');
    preview.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPreview).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Join Room 2' }));
    expect(onJoin).toHaveBeenCalledTimes(1);
    rerender(
      <ul>
        <RoomCard room={liveRooms[1]} names={names} variant="live" status={status} isJoined isPeeked />
      </ul>,
    );
    expect(screen.getByText('You’re here')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Join Room 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'true');
  });

  it('after the rooms closed, "Show on stage" and the thumbnail are both toggles with fixed labels and aria-pressed', async () => {
    const user = userEvent.setup();
    const onShowOnStage = vi.fn();
    const back = run(live, { type: 'bringEveryoneBack' });
    const room = selectRooms(back)[1];
    const { rerender } = render(
      <ul>
        <RoomCard room={room} names={names} variant="back" status="Shared notes saved" onShowOnStage={onShowOnStage} />
      </ul>,
    );
    const toggle = screen.getByRole('button', { name: 'Show on stage' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(onShowOnStage).toHaveBeenLastCalledWith(true);
    const thumb = screen.getByRole('button', { name: 'Show Room 2 on stage' });
    expect(thumb).toHaveAttribute('aria-pressed', 'false');
    await user.click(thumb);
    expect(onShowOnStage).toHaveBeenLastCalledWith(true);
    thumb.focus();
    await user.keyboard(' ');
    expect(onShowOnStage).toHaveBeenCalledTimes(3);
    rerender(
      <ul>
        <RoomCard
          room={room}
          names={names}
          variant="back"
          status="Shared notes saved"
          isOnStage
          onShowOnStage={onShowOnStage}
        />
      </ul>,
    );
    expect(screen.getByRole('button', { name: 'Show on stage' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Show Room 2 on stage' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('On stage')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show on stage' }));
    expect(onShowOnStage).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByRole('button', { name: 'Show Room 2 on stage' }));
    expect(onShowOnStage).toHaveBeenLastCalledWith(false);
  });

  it('stacks at most four avatars on the thumbnail and counts the rest', () => {
    const big = run(createRoom({ participants: 'thirty' }), { type: 'setRoomCount', roomCount: 2 }, { type: 'openRooms' });
    const room = selectRooms(big)[0];
    render(
      <ul>
        <RoomCard room={room} names={selectDisplayNames(big)} variant="live" status="Quiet" />
      </ul>,
    );
    expect(screen.getByText(`+${room.members.length - 4}`)).toBeInTheDocument();
  });
});
