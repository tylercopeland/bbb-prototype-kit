/**
 * The People tab of the side panel: reads the list, the filter and the
 * open menu from the store and maps every row action to a store action.
 * "Message privately" also asks the screen to focus the thread's composer,
 * because the row that was pressed unmounts with the People tab (WCAG
 * 2.4.3). Removing a person is announced by the `RoomProvider` and focus
 * is moved by `ParticipantList` itself.
 */
import { useMemo } from 'react';
import { ParticipantList } from '../../components';
import { useRoom, useRoomDispatch, useRoomStore } from '../../mocks/context';
import { canMessagePrivately } from '../../mocks/reducer';
import { selectPeople, selectPeopleFilterCounts, selectSelf } from '../../mocks/selectors';
import type { ParticipantId } from '../../mocks/types';
import { useRoomFocus } from './focus';
import { useParticipantActions } from './participantActions';

export function PeoplePanel() {
  const store = useRoomStore();
  const dispatch = useRoomDispatch();
  const { requestFocus } = useRoomFocus();
  const onAction = useParticipantActions();
  const filter = useRoom((s) => s.ui.peopleFilter);
  const people = useMemo(() => selectPeople(filter), [filter]);
  const { hands, others } = useRoom(people);
  const counts = useRoom(selectPeopleFilterCounts);
  const now = useRoom((s) => s.clock.now);
  const openMenu = useRoom((s) => s.ui.peopleMenu);
  // "Message privately" follows the Private chat setting (owner decision 2026-10-30):
  // a student sees none while it is off, a moderator always does.
  const privateChat = useRoom((s) => s.session.privateChat);
  const me = useRoom(selectSelf);
  const canMessage = (participantId: ParticipantId) =>
    me !== null && canMessagePrivately(store.getState(), me.id, participantId);

  const onMessage = (participantId: ParticipantId) => {
    requestFocus({ kind: 'composer' });
    dispatch({ type: 'openDm', participantId });
  };

  return (
    <ParticipantList
      hands={hands}
      others={others}
      counts={counts}
      filter={filter}
      onFilterChange={(f) => dispatch({ type: 'setPeopleFilter', filter: f })}
      now={now}
      openMenu={openMenu}
      onMenuOpenChange={(id, open) => dispatch({ type: 'openPeopleMenu', participantId: open ? id : null })}
      onMessage={onMessage}
      canMessage={canMessage}
      key={privateChat ? 'private-chat-on' : 'private-chat-off'}
      onAction={onAction}
    />
  );
}
