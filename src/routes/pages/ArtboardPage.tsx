import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import {
  RoomProvider,
  selectAlerts,
  selectPeopleCount,
  selectRaisedHands,
  selectRooms,
  selectUnreadTotal,
  useRoom,
} from '../../mocks';
import { findArtboard, isGroup, type Artboard } from '../artboards';
import { parseQuery, stateForArtboard } from '../initialState';
import { RouteLink } from '../RouteLink';
import { screenFor } from '../screens';
import { NotFoundPage } from './NotFoundPage';

/**
 * `/desktop/:artboard` and `/mobile/:artboard`: builds the store from the
 * artboard's props and the query, then renders the registered screen, or
 * the placeholder while the screen is not built.
 */
export function ArtboardPage() {
  const { group, artboard: stem } = useParams();
  const [searchParams] = useSearchParams();
  const artboard = isGroup(group) && stem ? findArtboard(group, stem) : undefined;
  const query = searchParams.toString();
  const initialState = useMemo(
    () => (artboard ? stateForArtboard(artboard, new URLSearchParams(query)) : null),
    [artboard, query],
  );
  const { liveClock } = parseQuery(new URLSearchParams(query)).options;

  useEffect(() => {
    if (artboard) document.title = `${artboard.title} · BigBlueButton 4.0 prototype`;
  }, [artboard]);

  if (!artboard || !initialState) return <NotFoundPage />;
  const { milestone, Screen } = screenFor(artboard);
  return (
    // The key remounts the provider when the route changes, so a new artboard gets a fresh store.
    <RoomProvider key={`${artboard.group}/${artboard.stem}?${query}`} initialState={initialState} liveClock={liveClock}>
      {Screen ? <Screen /> : <Placeholder artboard={artboard} milestone={milestone} />}
    </RoomProvider>
  );
}

/** What the store holds for this route, so a reviewer can see the deep link worked. */
function StateSummary() {
  const people = useRoom(selectPeopleCount);
  const hands = useRoom(selectRaisedHands);
  const unread = useRoom(selectUnreadTotal);
  const alerts = useRoom(selectAlerts);
  const rooms = useRoom(selectRooms);
  const panel = useRoom((s) => s.ui.panel);
  const filter = useRoom((s) => s.ui.peopleFilter);
  const phase = useRoom((s) => s.breakouts.phase);
  const rows: Array<[string, string]> = [
    ['People', `${people} · ${hands.length} hands raised`],
    ['Chat', `${unread} unread`],
    ['Alerts', alerts.length === 0 ? 'none' : alerts.map((a) => a.text).join(', ')],
    ['Panel', `${panel} · filter ${filter}`],
    ['Breakouts', `${phase} · ${rooms.length} rooms`],
  ];
  return (
    <dl className="flex flex-col gap-1 text-md">
      {rows.map(([term, value]) => (
        <div key={term} className="flex gap-4">
          <dt className="w-24 shrink-0 text-text-muted">{term}</dt>
          <dd className="text-text">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Placeholder({ artboard, milestone }: { artboard: Artboard; milestone: number }) {
  const props = Object.entries(artboard.props);
  return (
    <main className="mx-auto flex max-w-page flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-2xs font-semibold tracking-label text-text-muted uppercase">
          {artboard.group} · {artboard.number} · {artboard.size.width}×{artboard.size.height}
        </p>
        <h1 className="text-xl font-semibold text-text">{artboard.title}</h1>
        <p className="text-md text-text-secondary">Not built yet (milestone {milestone})</p>
      </header>
      <section className="flex flex-col gap-2" aria-labelledby="artboard-props">
        <h2 id="artboard-props" className="text-lg font-semibold text-text">
          Artboard props
        </h2>
        <p className="text-md text-text-secondary">
          From the {artboard.board} board. Each one sets the store’s initial state; add{' '}
          <code className="font-medium">?key=value</code> to the address to override it.
        </p>
        {props.length === 0 ? (
          <p className="text-md text-text-muted">No props: the board’s defaults.</p>
        ) : (
          <dl className="flex flex-col gap-1 text-md">
            {props.map(([key, value]) => (
              <div key={key} className="flex gap-4">
                <dt className="w-24 shrink-0 font-medium text-text-muted">{key}</dt>
                <dd className="text-text">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <section className="flex flex-col gap-2" aria-labelledby="artboard-state">
        <h2 id="artboard-state" className="text-lg font-semibold text-text">
          Room state
        </h2>
        <StateSummary />
      </section>
      <RouteLink href="/">Back to the artboards</RouteLink>
    </main>
  );
}
