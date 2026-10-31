/**
 * The Chat tab of the side panel: the Everyone / Direct segmented tabs
 * (owner decision 2026-10-24), the public messages with the composer, the
 * Direct list, and the private thread with its back button, lock and note
 * (canvas notes › How the panel works). Everything comes from the store.
 *
 * Focus (WCAG 2.4.3): a thread opened with "Message privately" focuses its
 * composer, and "Back to direct messages" focuses that person's row in the
 * Direct list (or the Direct tab when the row is gone), because the control
 * that was pressed unmounts in both cases. The request comes from the
 * screen's `RoomFocusContext` and is taken in the target's mount effect.
 */
import { useEffect, useMemo, useRef } from 'react';
import type { Key } from 'react-aria-components';
import { Icon } from '../../icons';
import {
  Avatar,
  ChatMessage,
  Composer,
  DMList,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { firstName } from '../../mocks/names';
import {
  selectDirectList,
  selectDisplayNames,
  selectOpenThread,
  selectParticipant,
  selectSelf,
  selectUnreadDirect,
} from '../../mocks/selectors';
import { formatTimeOfDay } from '../../mocks/time';
import type { ChatMessage as Message } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { useRoomFocus } from './focus';

const chatPanelStyles = tv({
  slots: {
    tabs: 'min-h-0 flex-1 gap-0',
    tabList: 'mx-4 mt-3',
    panel: 'flex min-h-0 flex-1 flex-col',
    messages: 'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4',
    bubbles: 'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4',
    /** The first item pushes the rest to the bottom (Focus.dc.html 484: messages sit above the composer), and the list still scrolls. */
    first: 'mt-auto',
    empty: 'mt-auto text-center text-sm text-text-muted',
    threadHeader: 'flex items-center gap-2 border-b border-border px-3 py-2',
    threadName: 'flex min-w-0 flex-1 flex-col',
    name: 'truncate text-md font-bold text-text',
    kind: 'flex items-center gap-1 text-xs text-text-muted',
    note: 'mx-auto mt-auto max-w-64 pb-1 text-center text-xs leading-4 text-text-muted',
  },
});

/** Scrolls to the newest message when one arrives. */
function useStickToBottom(count: number) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current;
    // jsdom has no scrollTo on elements.
    if (el && typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight });
  }, [count]);
  return ref;
}

export function ChatPanel() {
  const dm = useRoom((s) => s.ui.dm);
  return dm === null ? <ChatScopes /> : <Thread />;
}

function ChatScopes() {
  const styles = chatPanelStyles();
  const dispatch = useRoomDispatch();
  const scope = useRoom((s) => s.ui.scope);
  const unreadDirect = useRoom(selectUnreadDirect);
  const threads = useRoom(selectDirectList);
  const onChange = (key: Key) =>
    dispatch({ type: 'setScope', scope: key === 'direct' ? 'direct' : 'everyone' });

  // After "Back": the row of the thread just left takes focus; when that
  // thread is gone (the person left), the Direct tab does.
  const { takeFocus } = useRoomFocus();
  const directTabRef = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    const request = takeFocus('dmRow');
    if (request) (rows.current.get(request.participantId) ?? directTabRef.current)?.focus();
  }, [takeFocus]);

  return (
    <Tabs selectedKey={scope} onSelectionChange={onChange} className={styles.tabs()}>
      <TabList label="Chat type" className={styles.tabList()}>
        <Tab id="everyone">Everyone</Tab>
        <Tab
          id="direct"
          ref={directTabRef}
          badge={unreadDirect > 0 ? { count: unreadDirect, label: `${unreadDirect} unread` } : undefined}
        >
          Direct
        </Tab>
      </TabList>
      <TabPanel id="everyone" className={styles.panel()}>
        <EveryoneMessages />
        <Composer />
      </TabPanel>
      <TabPanel id="direct" className={styles.panel()}>
        <DMList
          threads={threads}
          rowRef={(id, el) => {
            if (el) rows.current.set(id, el);
            else rows.current.delete(id);
          }}
          onOpen={(id) => dispatch({ type: 'openDm', participantId: id })}
          onPickPerson={() => dispatch({ type: 'setPanel', panel: 'people' })}
        />
      </TabPanel>
    </Tabs>
  );
}

function useNames() {
  const participants = useRoom((s) => s.participants);
  return useMemo(() => new Map(participants.map((p) => [p.id, p.name])), [participants]);
}

function EveryoneMessages() {
  const styles = chatPanelStyles();
  const messages = useRoom((s) => s.chat.everyone);
  const me = useRoom(selectSelf)?.id;
  const names = useNames();
  const ref = useStickToBottom(messages.length);
  return (
    <ol ref={ref} aria-label="Messages to everyone" className={styles.messages()}>
      {messages.length === 0 && <li className={styles.empty()}>No messages yet. Say hello!</li>}
      {messages.map((m: Message, i) => (
        <ChatMessage
          key={m.id}
          name={names.get(m.from) ?? 'Someone who left'}
          participantId={m.from}
          time={formatTimeOfDay(m.sentAt)}
          isSelf={m.from === me}
          className={i === 0 ? styles.first() : undefined}
        >
          {m.text}
        </ChatMessage>
      ))}
    </ol>
  );
}

function Thread() {
  const styles = chatPanelStyles();
  const dispatch = useRoomDispatch();
  const dm = useRoom((s) => s.ui.dm);
  const other = useRoom(useMemo(() => selectParticipant(dm), [dm]));
  const thread = useRoom(selectOpenThread);
  const me = useRoom(selectSelf)?.id;
  const names = useRoom(selectDisplayNames);
  const privateChat = useRoom((s) => s.session.privateChat);
  const messages = thread?.messages ?? [];
  const ref = useStickToBottom(messages.length);

  // Opened from "Message privately": the composer takes focus on mount.
  const { requestFocus, takeFocus } = useRoomFocus();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (takeFocus('composer')) composerRef.current?.focus();
  }, [takeFocus]);

  if (!other || dm === null) return null;
  // The short name tells two Anas apart (B9): "Only you and Ana S. can see this conversation."
  const first = names[other.id] ?? firstName(other.name);
  const back = () => {
    requestFocus({ kind: 'dmRow', participantId: dm });
    dispatch({ type: 'closeDm' });
  };
  return (
    <>
      <div className={styles.threadHeader()}>
        <IconButton label="Back to direct messages" icon="back" onPress={back} />
        <Avatar aria-hidden="true" name={other.name} participantId={other.id} />
        <div className={styles.threadName()}>
          <h3 className={styles.name()}>{other.name}</h3>
          <p className={styles.kind()}>
            <Icon name="private" size="xs" />
            Direct message
          </p>
        </div>
      </div>
      <ol ref={ref} aria-label={`Messages with ${other.name}`} className={styles.bubbles()}>
        {/* The note follows the Private chat setting (owner decision 2026-10-30). */}
        <li className={styles.note()}>
          {privateChat
            ? `Only you and ${first} can see this conversation. Moderators can’t read it.`
            : `Private chat is off for students. Only you and ${first} can see this conversation, and ${first} can reply here.`}
        </li>
        {messages.map((m: Message) => (
          <ChatMessage
            key={m.id}
            variant="bubble"
            name={other.name}
            participantId={m.from}
            time={formatTimeOfDay(m.sentAt)}
            isSelf={m.from === me}
          >
            {m.text}
          </ChatMessage>
        ))}
      </ol>
      <Composer ref={composerRef} to={dm} />
    </>
  );
}
