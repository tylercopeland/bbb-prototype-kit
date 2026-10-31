/**
 * The phone room (the Mobile board): "same model: top = information, bottom
 * = action, slide first, webcams always visible" (canvas notes). In portrait
 * one column: the session header with the "3 updates" pill, the slide and
 * its pager (P1: slide on top, webcams below), the webcam band, the action
 * bar. In landscape two columns: the header, slide, pager and bar on the
 * left, the webcams on the right (P3: pager below the slide, sheets from
 * the end). The insets come from the safe-area utilities (P2), never a
 * fixed notch. Every value comes from the store through `useRoom`; every
 * change is a store action, so a deep link and a tap agree. MB1–MB10, MB15
 * and MB16 render this screen in different states.
 *
 * Sheets are driven by `ui.sheet` (and `ui.reacting`), the confirmations by
 * `ui.confirm`. Focus (WCAG 2.4.3): React Aria returns focus to the control
 * that opened a sheet; a sheet open on load had no press to return to, so
 * each carries a `FocusFallback` to its bar button, and focus is never lost
 * to `<body>`.
 */
import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { ConfirmDialog, FocusFallback, SessionHeader, Surface, ToastRegion, UpdatesPill } from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { selectAlerts, selectElapsed, selectPeopleCount, selectSelf, selectUnreadTotal } from '../../mocks/selectors';
import { tv } from '../../styles/tv';
import { RoomFocusContext, useRoomFocusState } from '../room/focus';
import { useRoomShortcuts } from '../room/useRoomShortcuts';
import { AlertsSheet } from './AlertsSheet';
import { EveryoneSheet } from './EveryoneSheet';
import { MobileActionBar } from './MobileActionBar';
import { PresentationBlock, WebcamBand } from './MobileStage';
import { MoreSheet } from './MoreSheet';
import { PeopleSheet } from './PeopleSheet';
import { ReactSheet } from './ReactSheet';

const mobileRoomStyles = tv({
  slots: {
    root: 'flex h-dvh w-full overflow-hidden bg-surface-stage',
    /** The column with the header, the slide, the bar: the whole screen in portrait, the left in landscape. */
    main: 'flex min-h-0 min-w-0 flex-1 flex-col gap-3 pt-safe-3 pb-safe-2',
    header: 'flex shrink-0 items-start justify-between gap-2',
    title: 'min-w-0 flex-1',
    band: '',
    bar: 'shrink-0',
  },
  variants: {
    orientation: {
      portrait: { root: 'flex-col', main: 'px-safe-4', band: 'min-h-0 flex-1' },
      landscape: {
        root: 'flex-row',
        main: 'pl-safe-4',
        band: 'w-72 shrink-0 pt-safe-3 pr-safe-3 pb-safe-2 pl-3',
      },
    },
  },
  defaultVariants: { orientation: 'portrait' },
});

export function MobileRoomScreen() {
  const dispatch = useRoomDispatch();
  const navigate = useNavigate();
  useRoomShortcuts();
  const focus = useRoomFocusState();

  const orientation = useRoom((s) => s.ui.orientation);
  const styles = mobileRoomStyles({ orientation });
  const position = orientation === 'landscape' ? 'end' : 'bottom';
  const session = useRoom((s) => s.session);
  const elapsed = useRoom(selectElapsed);
  const peopleCount = useRoom(selectPeopleCount);
  const alerts = useRoom(selectAlerts);
  const unread = useRoom(selectUnreadTotal);
  const me = useRoom(selectSelf);
  const sheet = useRoom((s) => s.ui.sheet);
  const reacting = useRoom((s) => s.ui.reacting);
  const confirm = useRoom((s) => s.ui.confirm);
  // The alerts are the teacher's triage (hands to call on, questions, the insight); a student's header has none.
  const isModerator = me?.isModerator ?? false;
  const peopleOpen = sheet === 'people' || sheet === 'chat' || sheet === 'student';

  // The controls that open the sheets and the confirmation, for the focus fallbacks.
  const updatesButton = useRef<HTMLButtonElement>(null);
  const peopleButton = useRef<HTMLButtonElement>(null);
  const reactButton = useRef<HTMLButtonElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const leaveButton = useRef<HTMLButtonElement>(null);
  const seeAllButton = useRef<HTMLButtonElement>(null);

  const band = (
    <WebcamBand
      onSeeAll={() => dispatch({ type: 'setSheet', sheet: 'cams' })}
      seeAllRef={seeAllButton}
      className={styles.band()}
    />
  );

  return (
    <RoomFocusContext.Provider value={focus}>
      <Surface as="main" kind="stage" className={styles.root()}>
        <div className={styles.main()}>
          <div className={styles.header()}>
            <SessionHeader
              title={session.title}
              recording={session.recording}
              peopleCount={peopleCount}
              elapsed={elapsed}
              layout="stacked"
              className={styles.title()}
            />
            {isModerator && (
              <UpdatesPill
                ref={updatesButton}
                kinds={alerts.map((a) => a.kind)}
                description="Opens the updates sheet"
                aria-haspopup="dialog"
                aria-expanded={sheet === 'alerts'}
                onPress={() => dispatch({ type: 'setSheet', sheet: 'alerts' })}
              />
            )}
          </div>
          <PresentationBlock orientation={orientation} />
          {orientation === 'portrait' && band}
          <MobileActionBar
            className={styles.bar()}
            peopleOpen={peopleOpen}
            reactOpen={reacting}
            moreOpen={sheet === 'more'}
            unread={unread}
            audio={me?.audio ?? 'notJoined'}
            camera={me?.camera ?? false}
            onPeopleChange={(open) => dispatch({ type: 'setSheet', sheet: open ? 'people' : 'none' })}
            onReact={() => dispatch({ type: 'setReacting', reacting: true })}
            onMore={() => dispatch({ type: 'setSheet', sheet: 'more' })}
            onLeave={() => dispatch({ type: 'setConfirm', confirm: 'leave' })}
            onJoinAudio={() => me && dispatch({ type: 'joinAudio', participantId: me.id })}
            onMicrophoneChange={(on) =>
              me && dispatch({ type: 'setAudio', participantId: me.id, audio: on ? 'live' : 'muted' })
            }
            onCameraChange={(on) => me && dispatch({ type: 'setCamera', participantId: me.id, on })}
            refs={{ people: peopleButton, react: reactButton, more: moreButton, leave: leaveButton }}
          />
        </div>
        {orientation === 'landscape' && band}

        <AlertsSheet isOpen={sheet === 'alerts'} position={position} triggerRef={updatesButton} />
        <PeopleSheet isOpen={peopleOpen} position={position} triggerRef={peopleButton} />
        <ReactSheet isOpen={reacting} position={position} triggerRef={reactButton} />
        <MoreSheet isOpen={sheet === 'more'} position={position} triggerRef={moreButton} />
        <EveryoneSheet isOpen={sheet === 'cams'} position={position} triggerRef={seeAllButton} />
        <ConfirmDialog
          isOpen={confirm === 'leave'}
          onOpenChange={(open) => !open && dispatch({ type: 'setConfirm', confirm: 'none' })}
          title="Leave the session?"
          description="You can come back with the same link. The class carries on without you."
          confirmLabel="Leave session"
          tone="danger"
          onConfirm={() => void navigate('/')}
        >
          <FocusFallback target={leaveButton} />
        </ConfirmDialog>
        <ToastRegion />
      </Surface>
    </RoomFocusContext.Provider>
  );
}
