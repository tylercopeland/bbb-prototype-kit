import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { breakoutStudents, createRoom, roomReducer, type RoomAction, type RoomState } from '../../mocks';
import { BreakoutSetup, formatOpenRooms } from './BreakoutSetup';

function Demo({ initial, onOpen, openRef }: { initial: RoomState; onOpen?: () => void; openRef?: React.Ref<HTMLButtonElement> }) {
  const [state, setState] = useState(initial);
  const dispatch = (action: RoomAction) => setState((s) => roomReducer(s, action));
  const b = state.breakouts;
  return (
    <BreakoutSetup
      mode={b.mode}
      roomCount={b.roomCount}
      studentCount={breakoutStudents(state.participants).length}
      assignment={b.assignment}
      durationMin={b.durationMin}
      options={b.options}
      onModeChange={(mode) => dispatch({ type: 'setBreakoutMode', mode })}
      onRoomCountChange={(roomCount) => dispatch({ type: 'setRoomCount', roomCount })}
      onAssignmentChange={(assignment) => dispatch({ type: 'setBreakoutAssignment', assignment })}
      onDurationChange={(durationMin) => dispatch({ type: 'setBreakoutDuration', durationMin })}
      onOptionChange={(option, value) => dispatch({ type: 'setBreakoutOption', option, value })}
      onOpen={onOpen}
      openButtonRef={openRef}
    />
  );
}

describe('BreakoutSetup', () => {
  it('has the board’s structure: split cards, the stepper and assignment, time chips, switches and the footer', () => {
    render(<Demo initial={createRoom()} />);
    const split = screen.getByRole('radiogroup', { name: 'How to split the class' });
    expect(within(split).getByRole('radio', { name: /^Groups/ })).toBeChecked();
    expect(within(split).getByRole('radio', { name: /^One per student/ })).not.toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Rooms' })).toHaveValue('4');
    expect(screen.getByText('3–4 students per room · 13 students')).toBeInTheDocument();
    const who = screen.getByRole('radiogroup', { name: 'Who goes where' });
    expect(within(who).getByRole('radio', { name: /^Spread evenly/ })).toBeChecked();
    const time = screen.getByRole('radiogroup', { name: 'Time' });
    for (const label of ['5 min', '10 min', '15 min', '20 min', '30 min']) {
      expect(within(time).getByRole('radio', { name: label })).toBeInTheDocument();
    }
    expect(within(time).getAllByRole('radio')).toHaveLength(5);
    expect(within(time).getByRole('radio', { name: '10 min' })).toBeChecked();
    const switches = screen.getAllByRole('switch');
    expect(switches.map((s) => (s as HTMLInputElement).checked)).toEqual([true, true, true, false]);
    expect(screen.getByRole('button', { name: 'Open 4 rooms' })).toBeInTheDocument();
    expect(screen.getByText('Students get a 10-second heads-up before they move.')).toBeInTheDocument();
    expect(formatOpenRooms(1)).toBe('Open 1 room');
  });

  it('changes every setting by keyboard', async () => {
    const user = userEvent.setup();
    render(<Demo initial={createRoom()} />);
    const rooms = screen.getByRole('textbox', { name: 'Rooms' });
    await user.click(screen.getByRole('button', { name: 'More Rooms' }));
    expect(rooms).toHaveValue('5');
    expect(screen.getByText('2–3 students per room · 13 students')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open 5 rooms' })).toBeInTheDocument();
    rooms.focus();
    await user.keyboard('{ArrowDown}');
    expect(rooms).toHaveValue('4');
    within(screen.getByRole('radiogroup', { name: 'Who goes where' }))
      .getByRole('radio', { name: /^Spread evenly/ })
      .focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /^Let students choose/ })).toBeChecked();
    within(screen.getByRole('radiogroup', { name: 'Time' })).getByRole('radio', { name: '10 min' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '15 min' })).toBeChecked();
    const record = screen.getByRole('switch', { name: 'Record breakout rooms' });
    record.focus();
    await user.keyboard(' ');
    expect(record).toBeChecked();
    // The split type: One per student hides the stepper and shows the note (BO4).
    screen.getByRole('radio', { name: /^Groups/ }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: /^One per student/ })).toBeChecked();
    expect(screen.queryByRole('textbox', { name: 'Rooms' })).not.toBeInTheDocument();
    expect(screen.getByText(/13 rooms, one student each/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open 13 rooms' })).toBeInTheDocument();
  });

  it('allows up to 50 rooms and no fewer than 2 (B6)', async () => {
    const user = userEvent.setup();
    render(<Demo initial={createRoom({ participants: 'thirty' })} />);
    const rooms = screen.getByRole('textbox', { name: 'Rooms' });
    rooms.focus();
    await user.keyboard('{End}');
    expect(rooms).toHaveValue('50');
    expect(screen.getByRole('button', { name: 'More Rooms' })).toBeDisabled();
    await user.keyboard('{Home}');
    expect(rooms).toHaveValue('2');
    expect(screen.getByRole('button', { name: 'Fewer Rooms' })).toBeDisabled();
  });

  it('confirms before opening the rooms (B5): Cancel takes focus, Escape cancels, confirm opens', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<Demo initial={createRoom()} onOpen={onOpen} openRef={ref} />);
    const open = screen.getByRole('button', { name: 'Open 4 rooms' });
    expect(ref.current).toBe(open);
    open.focus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('alertdialog', { name: 'Open 4 rooms?' });
    expect(dialog).toHaveAccessibleDescription(/10-second heads-up, then move to their rooms for 10 minutes/);
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onOpen).not.toHaveBeenCalled();
    await waitFor(() => expect(open).toHaveFocus());
    await user.keyboard(' ');
    await screen.findByRole('alertdialog');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Open 4 rooms' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });
});
