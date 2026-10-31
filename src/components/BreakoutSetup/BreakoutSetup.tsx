import { useState, type Ref } from 'react';
import { Label, Radio as RacRadio, RadioGroup as RacRadioGroup } from 'react-aria-components';
import { DURATIONS_MIN, MAX_ROOMS, MIN_ROOMS, ROOM_COLORS, roomCountFor, studentsPerRoom } from '../../mocks/breakouts';
import type { BreakoutAssignment, BreakoutMode, BreakoutOptions } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { Button } from '../Button';
import { Chip, ChipGroup } from '../ChipGroup';
import { ConfirmDialog } from '../Dialog';
import { Stepper } from '../Stepper';
import { Switch } from '../Switch';

/**
 * The breakout setup panel (Breakout.dc.html 209–273, docs/screenshots/
 * BO2SetupGroups-desk.png; owner decision 2026-10-23, B10: this structure,
 * not the BreakoutSetup board's variants): how to split the class as two
 * radio cards, the room stepper with Spread evenly or Let students choose,
 * the time chips (X8), the option switches, and the "Open N rooms" footer.
 * It scrolls between the panel's header and its footer.
 */
export const breakoutSetupStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-1 flex-col',
    body: 'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4',
    group: 'flex flex-col gap-2',
    kicker: 'text-2xs font-bold tracking-label text-text-muted uppercase',
    cards: 'grid grid-cols-2 gap-2',
    rows: 'flex flex-col gap-2',
    /** The solo note (Breakout.dc.html 248): a sunken box. */
    note: 'rounded-lg bg-surface-sunken p-3 text-sm leading-5 text-text-secondary',
    options: 'flex flex-col',
    footer: 'flex flex-col gap-2 border-t border-border px-4 pt-3 pb-4',
    open: 'w-full',
    hint: 'text-center text-xs text-text-muted',
  },
});

/**
 * A split-type card (Breakout.dc.html 215–221): the color marks, a bold
 * label and a line of description. Selected takes the selected pair and
 * the inset ring, so the choice is never color alone; the group has radio
 * semantics, so it is one of two.
 */
export const splitCardStyles = tv({
  base: 'group flex cursor-default flex-col gap-2 rounded-lg border border-border-control bg-surface p-3 text-left text-text focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken data-selected:border-selected-border data-selected:bg-selected data-selected:text-selected-text data-selected:selected-ring data-selected:data-hovered:bg-selected data-selected:data-pressed:bg-selected',
});

export const splitCardTextStyles = tv({
  slots: {
    marks: 'flex w-16 flex-wrap gap-1',
    label: 'text-md font-bold',
    description: 'text-xs leading-4 text-text-muted group-data-selected:text-selected-text',
  },
});

/** One color mark in a split card: a bar for Groups, a dot for One per student. */
export const roomMarkStyles = tv({
  base: 'rounded-xs',
  variants: {
    shape: {
      bar: 'h-3 w-7',
      dot: 'size-2',
    },
    color: {
      1: 'bg-room-1',
      2: 'bg-room-2',
      3: 'bg-room-3',
      4: 'bg-room-4',
      5: 'bg-room-5',
      6: 'bg-room-6',
      7: 'bg-room-7',
      8: 'bg-room-8',
    },
  },
  defaultVariants: { shape: 'dot', color: 1 },
});

/**
 * An assignment row (Breakout.dc.html 239–242): a drawn radio circle, the
 * label and its description. The circle fills when selected and the row
 * takes the selected border, with `aria-checked` on the radio.
 */
export const assignRowStyles = tv({
  base: 'group flex cursor-default items-center gap-3 rounded-control border border-border-control bg-surface px-3 py-2 text-left text-text focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken data-selected:border-selected-border data-selected:bg-selected data-selected:text-selected-text data-selected:data-hovered:bg-selected data-selected:data-pressed:bg-selected',
});

export const assignRowPartsStyles = tv({
  slots: {
    circle:
      'flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-border-control group-data-selected:border-accent',
    innerDot: 'size-2 rounded-full bg-transparent group-data-selected:bg-accent',
    body: 'flex min-w-0 flex-col',
    label: 'text-md font-semibold',
    description: 'text-xs text-text-muted group-data-selected:text-selected-text',
  },
});

export type RoomMarkColor = NonNullable<VariantProps<typeof roomMarkStyles>['color']>;

const splitTypes: Array<{ mode: BreakoutMode; label: string; description: string }> = [
  { mode: 'groups', label: 'Groups', description: 'Mix students into a few rooms' },
  { mode: 'solo', label: 'One per student', description: 'Everyone gets their own room' },
];

const assignments: Array<{ value: BreakoutAssignment; label: string; description: string }> = [
  { value: 'even', label: 'Spread evenly', description: 'Shuffled so room sizes differ by one at most' },
  { value: 'choose', label: 'Let students choose', description: 'They pick a room; you can still move people' },
];

const optionRows: Array<{ option: keyof BreakoutOptions; label: string }> = [
  { option: 'sendSlide', label: 'Send my current slide to every room' },
  { option: 'canReturn', label: 'Students can come back on their own' },
  { option: 'autoReturn', label: 'Bring everyone back when time is up' },
  { option: 'record', label: 'Record breakout rooms' },
];

/** "Open 4 rooms", "Open 1 room". */
export function formatOpenRooms(count: number): string {
  return `Open ${count} ${count === 1 ? 'room' : 'rooms'}`;
}

export interface BreakoutSetupProps {
  mode: BreakoutMode;
  /** Rooms in groups mode (`MIN_ROOMS`–`MAX_ROOMS`, B6). */
  roomCount: number;
  /** How many students there are: one room each in solo mode. */
  studentCount: number;
  assignment: BreakoutAssignment;
  durationMin: number;
  options: BreakoutOptions;
  onModeChange?: (mode: BreakoutMode) => void;
  onRoomCountChange?: (roomCount: number) => void;
  onAssignmentChange?: (assignment: BreakoutAssignment) => void;
  onDurationChange?: (durationMin: number) => void;
  onOptionChange?: (option: keyof BreakoutOptions, value: boolean) => void;
  /** Open the rooms, after the confirmation (B5). */
  onOpen?: () => void;
  /** The "Open N rooms" button. */
  openButtonRef?: Ref<HTMLButtonElement>;
  className?: string;
}

/**
 * Every choice is a React Aria control: the split type and the assignment
 * are radio groups, the rooms a `Stepper` (2 to 50, B6), the time a
 * `ChipGroup` (X8) and the options `Switch` rows. "Open N rooms" asks for
 * confirmation in an alert dialog whose Cancel takes focus first (B5), and
 * calls `onOpen` only when confirmed. Nothing is sent until then, as the
 * panel's subtitle says.
 */
export function BreakoutSetup({
  mode,
  roomCount,
  studentCount,
  assignment,
  durationMin,
  options,
  onModeChange,
  onRoomCountChange,
  onAssignmentChange,
  onDurationChange,
  onOptionChange,
  onOpen,
  openButtonRef,
  className,
}: BreakoutSetupProps) {
  const styles = breakoutSetupStyles();
  const card = splitCardTextStyles();
  const row = assignRowPartsStyles();
  const [confirming, setConfirming] = useState(false);
  const opening = roomCountFor(mode, roomCount, studentCount);
  const openLabel = formatOpenRooms(opening);

  return (
    <div className={styles.root({ className })}>
      <div className={styles.body()}>
        <RacRadioGroup
          value={mode}
          onChange={(value) => onModeChange?.(value as BreakoutMode)}
          className={styles.group()}
        >
          <Label className={styles.kicker()}>How to split the class</Label>
          <div className={styles.cards()}>
            {splitTypes.map((t) => (
              <RacRadio
                key={t.mode}
                value={t.mode}
                className={splitCardStyles()}
              >
                <span aria-hidden="true" className={card.marks()}>
                  {t.mode === 'groups'
                    ? [1, 2, 3, 4].map((c) => (
                        <span key={c} className={roomMarkStyles({ shape: 'bar', color: c as RoomMarkColor })} />
                      ))
                    : Array.from({ length: 10 }, (_, i) => (
                        <span
                          key={i}
                          className={roomMarkStyles({ shape: 'dot', color: ((i % ROOM_COLORS) + 1) as RoomMarkColor })}
                        />
                      ))}
                </span>
                <span className={card.label()}>{t.label}</span>
                <span className={card.description()}>{t.description}</span>
              </RacRadio>
            ))}
          </div>
        </RacRadioGroup>

        {mode === 'groups' ? (
          <div className={styles.group()}>
            <Stepper
              label="Rooms"
              value={roomCount}
              minValue={MIN_ROOMS}
              maxValue={MAX_ROOMS}
              onChange={(value) => {
                if (Number.isFinite(value)) onRoomCountChange?.(value);
              }}
              description={`${studentsPerRoom(studentCount, roomCount)} students per room · ${studentCount} ${studentCount === 1 ? 'student' : 'students'}`}
            />
            <RacRadioGroup
              aria-label="Who goes where"
              value={assignment}
              onChange={(value) => onAssignmentChange?.(value as BreakoutAssignment)}
              className={styles.rows()}
            >
              {assignments.map((a) => (
                <RacRadio
                  key={a.value}
                  value={a.value}
                  className={assignRowStyles()}
                >
                  <span aria-hidden="true" className={row.circle()}>
                    <span className={row.innerDot()} />
                  </span>
                  <span className={row.body()}>
                    <span className={row.label()}>{a.label}</span>
                    <span className={row.description()}>{a.description}</span>
                  </span>
                </RacRadio>
              ))}
            </RacRadioGroup>
          </div>
        ) : (
          <p className={styles.note()}>
            {studentCount} {studentCount === 1 ? 'room' : 'rooms'}, one student each. Good for independent work,
            quizzes or quiet 1:1 check-ins. Previews let you look in on everyone from one grid.
          </p>
        )}

        <ChipGroup
          label="Time"
          value={String(durationMin)}
          onChange={(value) => onDurationChange?.(Number(value))}
          density="compact"
        >
          {DURATIONS_MIN.map((minutes) => (
            <Chip key={minutes} value={String(minutes)} density="compact">
              {`${minutes} min`}
            </Chip>
          ))}
        </ChipGroup>

        <div className={styles.options()}>
          {optionRows.map((o) => (
            <Switch
              key={o.option}
              isSelected={options[o.option]}
              onChange={(value) => onOptionChange?.(o.option, value)}
            >
              {o.label}
            </Switch>
          ))}
        </div>
      </div>
      <div className={styles.footer()}>
        <Button
          ref={openButtonRef}
          variant="primary"
          size="touch"
          onPress={() => setConfirming(true)}
          className={styles.open()}
        >
          {openLabel}
        </Button>
        <p className={styles.hint()}>Students get a 10-second heads-up before they move.</p>
      </div>
      <ConfirmDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        title={`${openLabel}?`}
        description={`Students get a 10-second heads-up, then move to their rooms for ${durationMin} minutes. You stay in the main room and can preview or join any room.`}
        confirmLabel={openLabel}
        onConfirm={() => onOpen?.()}
      />
    </div>
  );
}
