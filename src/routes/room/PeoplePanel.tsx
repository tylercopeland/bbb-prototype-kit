/**
 * The People tab of the side panel: reads the list, the filter and the
 * open menu from the store and maps every row action to a store action.
 */
import { useMemo } from 'react';
import { ParticipantList, type ParticipantAction } from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { selectPeople, selectPeopleFilterCounts } from '../../mocks/selectors';
import type { ParticipantId } from '../../mocks/types';

export function PeoplePanel() {
  const dispatch = useRoomDispatch();
  const filter = useRoom((s) => s.ui.peopleFilter);
  const people = useMemo(() => selectPeople(filter), [filter]);
  const { hands, others } = useRoom(people);
  const counts = useRoom(selectPeopleFilterCounts);
  const now = useRoom((s) => s.clock.now);
  const openMenu = useRoom((s) => s.ui.peopleMenu);

  const onAction = (participantId: ParticipantId, action: ParticipantAction) => {
    switch (action.type) {
      case 'makePresenter':
        return dispatch({ type: 'makePresenter', participantId });
      case 'setCamera':
        return dispatch({ type: 'setCamera', participantId, on: action.on });
      case 'microphone':
        return dispatch(action.on ? { type: 'requestUnmute', participantId } : { type: 'mute', participantId });
      case 'flag':
        return dispatch({ type: 'setParticipantFlag', participantId, flag: action.flag, value: action.value });
      case 'remove':
        return dispatch({ type: 'removeParticipant', participantId });
    }
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
      onMessage={(id) => dispatch({ type: 'openDm', participantId: id })}
      onAction={onAction}
    />
  );
}
