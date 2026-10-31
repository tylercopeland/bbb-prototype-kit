/**
 * The People & chat sheet (MB3, MB5, MB9; Mobile.dc.html 117–174): the
 * desktop's People and Chat tabs in one bottom sheet (a side sheet in
 * landscape), "with the same tabs, filters and status icons as desktop"
 * (canvas notes). The tabs sit in the sheet's header beside the close
 * button, their panels in the body (D3), through the Sheet's `frame`. Each
 * tab renders the desktop panel from `src/routes/room/`, so the phone and
 * the desktop read and change the same store the same way.
 *
 * Tapping a row's ⋯ opens the student actions sheet (MB4) over this one:
 * one stacking model, one scrim (P4); its rows are real switches (P5) and
 * Remove confirms (P9). A student viewer (MB15) sees no ⋯ at all.
 */
import { useEffect, useRef, type RefObject } from 'react';
import type { Key } from 'react-aria-components';
import {
  Avatar,
  Button,
  ConfirmDialog,
  FocusFallback,
  participantStatus,
  Sheet,
  StackedOverlay,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type SheetPosition,
} from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { formatRaisedHands, formatUnread } from '../../mocks/format';
import { canMessagePrivately } from '../../mocks/reducer';
import {
  participantSubline,
  selectParticipant,
  selectRaisedHands,
  selectSelf,
  selectUnreadTotal,
} from '../../mocks/selectors';
import { tv } from '../../styles/tv';
import { ChatPanel } from '../room/ChatPanel';
import { useRoomFocus } from '../room/focus';
import { notInPrototype } from '../room/notInPrototype';
import { useParticipantActions } from '../room/participantActions';
import { PeoplePanel } from '../room/PeoplePanel';

const peopleSheetStyles = tv({
  slots: {
    sheet: 'h-full',
    tabs: 'min-h-0 flex-1 gap-0',
    tabList: 'min-w-0 flex-1',
    panel: 'flex min-h-0 flex-1 flex-col',
  },
});

const studentSheetStyles = tv({
  slots: {
    header: 'flex items-center gap-3 pb-3',
    summary: 'min-w-0 text-sm text-text-muted',
    actions: 'flex gap-2 pb-2',
    action: 'min-w-0 flex-1',
    remove: 'mt-2 w-full justify-start px-2',
  },
});

export interface PeopleSheetProps {
  isOpen: boolean;
  position: SheetPosition;
  /** The People & chat bar button, for the focus fallback when the sheet was open on load. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function PeopleSheet({ isOpen, position, triggerRef }: PeopleSheetProps) {
  const styles = peopleSheetStyles();
  const dispatch = useRoomDispatch();
  const sheet = useRoom((s) => s.ui.sheet);
  const studentId = useRoom((s) => s.ui.sheetStudent);
  const raisedHands = useRoom(selectRaisedHands).filter((p) => !p.isSelf).length;
  const unread = useRoom(selectUnreadTotal);
  const me = useRoom(selectSelf);
  const canModerate = me?.isModerator ?? false;
  const tab = sheet === 'chat' ? 'chat' : 'people';
  // The ⋯ button that opened the student sheet, and the People tab as the fallback when that row is gone
  // (the person was removed, or the sheet opened from a deep link): React Aria's own restore does not reach
  // a trigger inside another modal, so the student sheet moves focus itself (WCAG 2.4.3).
  const opener = useRef<HTMLElement | null>(null);
  const peopleTab = useRef<HTMLDivElement>(null);
  const onTab = (key: Key) => dispatch({ type: 'setSheet', sheet: key === 'chat' ? 'chat' : 'people' });

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => !open && dispatch({ type: 'setSheet', sheet: 'none' })}
      title="People and chat"
      titleHidden
      position={position}
      className={styles.sheet()}
      frame={(content) => (
        <Tabs selectedKey={tab} onSelectionChange={onTab} className={styles.tabs()}>
          {content}
        </Tabs>
      )}
      stacked={
        sheet === 'student' && studentId !== null ? (
          <StudentSheet
            participantId={studentId}
            position={position}
            openerRef={opener}
            fallbackRef={peopleTab}
          />
        ) : undefined
      }
      headerExtra={
        <TabList label="People and chat" className={styles.tabList()}>
          <Tab
            id="people"
            ref={peopleTab}
            badge={
              raisedHands > 0 ? { count: raisedHands, label: formatRaisedHands(raisedHands) } : undefined
            }
          >
            People
          </Tab>
          <Tab
            id="chat"
            badge={unread > 0 && tab !== 'chat' ? { count: unread, label: formatUnread(unread) } : undefined}
          >
            Chat
          </Tab>
        </TabList>
      }
    >
      <FocusFallback target={triggerRef} />
      <TabPanel id="people" className={styles.panel()}>
        <PeoplePanel
          canModerate={canModerate}
          onOpenActions={(participantId, trigger) => {
            opener.current = trigger;
            dispatch({ type: 'setSheet', sheet: 'student', student: participantId });
          }}
          onAnalytics={() => {
            dispatch({ type: 'setSheet', sheet: 'none' });
            notInPrototype('The Learning Analytics Dashboard');
          }}
        />
      </TabPanel>
      <TabPanel id="chat" className={styles.panel()}>
        <ChatPanel />
      </TabPanel>
    </Sheet>
  );
}

interface StudentSheetProps {
  participantId: string;
  position: SheetPosition;
  /** The ⋯ button that opened this sheet, when a press did. */
  openerRef: RefObject<HTMLElement | null>;
  /** The People tab: where focus lands when that button is gone. */
  fallbackRef: RefObject<HTMLElement | null>;
}

/**
 * The student actions sheet (MB4, Mobile.dc.html 176–198), stacked over
 * People: the person's avatar, name and status, Message and Make presenter,
 * then the Microphone, Camera, Whiteboard access, Moderator and Lock public
 * chat switches (the desktop ⋯ menu's checkbox items as `Switch` rows, P5),
 * and Remove from session behind a `ConfirmDialog`. The actions go through
 * `useParticipantActions`, the same mapping the desktop menu uses.
 */
function StudentSheet({ participantId, position, openerRef, fallbackRef }: StudentSheetProps) {
  const styles = studentSheetStyles();
  const dispatch = useRoomDispatch();
  const act = useParticipantActions();
  const { requestFocus } = useRoomFocus();
  const p = useRoom(selectParticipant(participantId));
  const now = useRoom((s) => s.clock.now);
  const confirm = useRoom((s) => s.ui.confirm);
  const me = useRoom(selectSelf);
  const canMessage = useRoom((s) => (me ? canMessagePrivately(s, me.id, participantId) : false));
  const removeButton = useRef<HTMLButtonElement>(null);
  // Why the sheet is going: closed (Escape, the close button, the scrim) or the person removed. "Message" sets
  // neither, because the thread's composer takes focus then. The move runs a tick after the unmount, after
  // React Aria's own restore, which lands on the People dialog itself.
  const leaving = useRef<'close' | 'remove' | null>(null);
  useEffect(
    () => () => {
      const reason = leaving.current;
      if (!reason) return;
      const button = openerRef.current;
      const target = reason === 'close' && button?.isConnected ? button : fallbackRef.current;
      setTimeout(() => target?.focus(), 0);
    },
    [openerRef, fallbackRef],
  );
  if (!p) return null;

  const joined = p.audio === 'live' || p.audio === 'speaking' || p.audio === 'muted';
  const micOn = p.audio === 'live' || p.audio === 'speaking';
  const micHint = !joined
    ? 'Audio not joined'
    : p.unmuteRequested
      ? 'Unmute requested · turning on again cancels it'
      : micOn
        ? undefined
        : 'Turning on asks them to unmute';
  const subline = participantSubline(p, now);
  const summary = subline ? `${participantStatus(p)} · ${subline}` : participantStatus(p);
  const close = () => {
    leaving.current = 'close';
    dispatch({ type: 'setSheet', sheet: 'people' });
  };
  const flag = (name: 'hasWhiteboard' | 'isModerator' | 'chatLocked') => (value: boolean) =>
    act(p.id, { type: 'flag', flag: name, value });

  return (
    <Sheet isOpen onOpenChange={(open) => !open && close()} title={p.name} position={position}>
      <FocusFallback target={fallbackRef} />
      <div className={styles.header()}>
        <Avatar
          aria-hidden="true"
          name={p.name}
          participantId={p.id}
          size="xl"
          shape={p.role === 'teacher' ? 'square' : 'circle'}
          isSpeaking={p.audio === 'speaking'}
        />
        <p className={styles.summary()}>{summary}</p>
      </div>
      <div className={styles.actions()}>
        {canMessage && (
          <Button
            size="touch"
            icon="chat"
            className={styles.action()}
            onPress={() => {
              requestFocus({ kind: 'composer' });
              dispatch({ type: 'openDm', participantId: p.id });
            }}
          >
            Message
          </Button>
        )}
        <Button
          size="touch"
          icon="presenter"
          isDisabled={p.isPresenter}
          className={styles.action()}
          onPress={() => act(p.id, { type: 'makePresenter' })}
        >
          Make presenter
        </Button>
      </div>
      <Switch
        isSelected={micOn}
        isDisabled={!joined}
        description={micHint}
        onChange={(on) => act(p.id, { type: 'microphone', on })}
      >
        Microphone
      </Switch>
      <Switch isSelected={p.camera} onChange={(on) => act(p.id, { type: 'setCamera', on })}>
        Camera
      </Switch>
      <Switch isSelected={p.hasWhiteboard} onChange={flag('hasWhiteboard')}>
        Whiteboard access
      </Switch>
      <Switch isSelected={p.isModerator} onChange={flag('isModerator')}>
        Moderator
      </Switch>
      <Switch isSelected={p.chatLocked} onChange={flag('chatLocked')}>
        Lock public chat
      </Switch>
      <Button
        ref={removeButton}
        variant="ghost"
        tone="danger"
        size="touch"
        icon="removeFromSession"
        aria-haspopup="dialog"
        className={styles.remove()}
        onPress={() => dispatch({ type: 'setConfirm', confirm: 'remove' })}
      >
        Remove from session
      </Button>
      <StackedOverlay>
        <ConfirmDialog
          isOpen={confirm === 'remove'}
          onOpenChange={(open) => !open && dispatch({ type: 'setConfirm', confirm: 'none' })}
          title={`Remove ${p.name}?`}
          description="They leave the session now and can only come back with a new invitation."
          confirmLabel="Remove"
          tone="danger"
          onConfirm={() => {
            leaving.current = 'remove';
            act(p.id, { type: 'remove' });
          }}
        >
          <FocusFallback target={removeButton} />
        </ConfirmDialog>
      </StackedOverlay>
    </Sheet>
  );
}
