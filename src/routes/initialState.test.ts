import { describe, expect, it } from 'vitest';
import { selectAlerts, selectClosingLeft, selectOpenHelp, selectRooms, selectTimerLeft } from '../mocks';
import { artboards, findArtboard } from './artboards';
import { applyProps, KNOWN_PROPS, parseQuery, stateForArtboard } from './initialState';
import { createRoom } from '../mocks';

const board = (group: 'desktop' | 'mobile', stem: string) => {
  const a = findArtboard(group, stem);
  if (!a) throw new Error(`No artboard ${group}/${stem}`);
  return a;
};

describe('artboard props', () => {
  it('are all known to the mapping', () => {
    for (const a of artboards) {
      for (const key of Object.keys(a.props)) {
        expect(KNOWN_PROPS[a.board], `${a.stem} uses ${key}`).toContain(key);
      }
    }
  });

  it('build a state for every artboard without throwing', () => {
    for (const a of artboards) expect(() => stateForArtboard(a)).not.toThrow();
  });
});

describe('stateForArtboard', () => {
  it('F1: the bare room, nothing open', () => {
    const s = stateForArtboard(board('desktop', 'F1Bar-4roh-l8ju'));
    expect(s.ui).toMatchObject({ layout: 'bar', panel: 'none', scope: 'everyone', dm: null });
    expect(s.participants).toHaveLength(14);
    expect(s.plugins.open).toBe(false);
  });

  it('G1: the People panel on Everyone', () => {
    const s = stateForArtboard(board('desktop', 'G1People-my6z'));
    expect(s.ui).toMatchObject({ panel: 'people', scope: 'everyone', peopleFilter: 'all' });
  });

  it('G2–G5: chat scopes and direct threads', () => {
    expect(stateForArtboard(board('desktop', 'G2ChatEveryone-gqvt')).ui).toMatchObject({ panel: 'chat', scope: 'everyone' });
    expect(stateForArtboard(board('desktop', 'G3ChatDirect-56ch')).ui).toMatchObject({ panel: 'chat', scope: 'direct', dm: null });
    const g4 = stateForArtboard(board('desktop', 'G4DmRafaela-gtn4'));
    expect(g4.ui).toMatchObject({ panel: 'chat', scope: 'direct', dm: 'rafaela' });
    expect(g4.chat.direct.find((t) => t.with === 'rafaela')?.messages.every((m) => m.read)).toBe(true);
    const g5 = stateForArtboard(board('desktop', 'G5DmFromPeople-ogjp'));
    expect(g5.ui.dm).toBe('frederick');
    expect(g5.chat.direct.find((t) => t.with === 'frederick')?.messages).toEqual([]);
  });

  it('L1: People filtered to low engagement, from the insight pill', () => {
    const s = stateForArtboard(board('desktop', 'L1LowEngagement-qeqx'));
    expect(s.ui).toMatchObject({ panel: 'people', peopleFilter: 'low' });
    expect(selectAlerts(s).find((a) => a.kind === 'insight')?.text).toBe('3 low engagement');
  });

  it('O2, H1, H2, N1, M1, M2, O1, BO1: pickers, menus and sharing', () => {
    expect(stateForArtboard(board('desktop', 'O2StudentActions')).ui).toMatchObject({ panel: 'people', peopleMenu: 'anton' });
    expect(stateForArtboard(board('desktop', 'H1MediaSlides-2x0x')).ui).toMatchObject({ mediaOpen: true, mediaType: 'slides' });
    expect(stateForArtboard(board('desktop', 'H2MediaScreen-ez5s')).ui).toMatchObject({ mediaOpen: true, mediaType: 'screen' });
    expect(stateForArtboard(board('desktop', 'N1Overview-xpbk')).presentation.overviewOpen).toBe(true);
    expect(stateForArtboard(board('desktop', 'M1ShareScreen-k5tp')).presentation).toMatchObject({ share: 'screen', screenShared: true });
    expect(stateForArtboard(board('desktop', 'M2ShareDeck-581i')).presentation).toMatchObject({ share: 'deck', screenShared: true });
    expect(stateForArtboard(board('desktop', 'O1Analytics')).ui.analyticsTipShown).toBe(true);
    expect(stateForArtboard(board('desktop', 'BO1Entry-desk')).plugins.open).toBe(true);
  });

  it('PL1–PL3 and TM1–TM4: poll and timer phases', () => {
    expect(stateForArtboard(board('desktop', 'PL1Setup')).poll).toMatchObject({ phase: 'setup', shown: false });
    const live = stateForArtboard(board('desktop', 'PL2Live'));
    expect(live.poll).toMatchObject({ phase: 'live', shown: false, votes: [6, 1, 0, 2] });
    expect(live.ui.panel).toBe('poll');
    expect(stateForArtboard(board('desktop', 'PL3Shown')).poll.shown).toBe(true);
    expect(stateForArtboard(board('desktop', 'TM1Ready')).timer).toMatchObject({ phase: 'ready', leftSec: 300 });
    const running = stateForArtboard(board('desktop', 'TM2Running'));
    expect(running.timer.phase).toBe('running');
    expect(selectTimerLeft(running)).toBe(222);
    expect(stateForArtboard(board('desktop', 'TM3Min')).timer).toMatchObject({ phase: 'running', minimized: true });
    expect(stateForArtboard(board('desktop', 'TM4Done')).timer).toMatchObject({ phase: 'done', leftSec: 0 });
  });

  it('BO2–BO4: breakout setup with rooms, a move and solo mode', () => {
    const bo2 = stateForArtboard(board('desktop', 'BO2SetupGroups-desk'));
    expect(bo2.ui.breakoutsOpen).toBe(true);
    expect(bo2.breakouts).toMatchObject({ phase: 'setup', mode: 'groups', roomCount: 4, moving: null });
    expect(selectRooms(bo2)).toHaveLength(4);
    expect(stateForArtboard(board('desktop', 'BO3SetupMove-desk')).breakouts.moving).toBe('ana');
    const solo = stateForArtboard(board('desktop', 'BO4SetupSolo-desk'));
    expect(solo.breakouts.mode).toBe('solo');
    expect(selectRooms(solo)).toHaveLength(13);
  });

  it('BO5–BO10: live rooms with a help request from data, a preview, the main view and the countdown', () => {
    const bo5 = stateForArtboard(board('desktop', 'BO5LiveGroups-desk'));
    expect(bo5.breakouts.phase).toBe('live');
    expect(selectOpenHelp(bo5).map((h) => h.roomIndex)).toEqual([1]);
    expect(selectAlerts(bo5)[0].text).toBe('Room 2 asked for help');
    expect(stateForArtboard(board('desktop', 'BO6PeekGroup-desk')).breakouts.peek).toBe(1);
    const solo = stateForArtboard(board('desktop', 'BO7LiveSolo-desk'));
    expect(selectRooms(solo)).toHaveLength(13);
    expect(selectOpenHelp(solo)[0]).toMatchObject({ roomIndex: 2, from: 'cibelle' });
    expect(stateForArtboard(board('desktop', 'BO8PeekSolo-desk')).breakouts.peek).toBe(2);
    expect(stateForArtboard(board('desktop', 'BO9MainView-desk')).breakouts.view).toBe('main');
    const closing = stateForArtboard(board('desktop', 'BO10Closing-desk'));
    expect(selectClosingLeft(closing)).toBe(60);
  });

  it('BO11–BO12: everyone back, with a room on stage', () => {
    const back = stateForArtboard(board('desktop', 'BO11Back-desk'));
    expect(back.breakouts).toMatchObject({ phase: 'back', view: 'main', onStage: null });
    expect(selectOpenHelp(back)).toEqual([]);
    expect(stateForArtboard(board('desktop', 'BO12ShareBack-desk')).breakouts.onStage).toBe(1);
  });

  it('MB1–MB14: orientation, sheets, annotation and the minimized presentation', () => {
    expect(stateForArtboard(board('mobile', 'MB1Room')).ui).toMatchObject({ orientation: 'portrait', sheet: 'none' });
    expect(stateForArtboard(board('mobile', 'MB4Student')).ui).toMatchObject({ sheet: 'student', sheetStudent: 'anton' });
    expect(stateForArtboard(board('mobile', 'MB6React')).ui).toMatchObject({ sheet: 'react', reacting: true });
    expect(stateForArtboard(board('mobile', 'MB8Landscape')).ui.orientation).toBe('landscape');
    expect(stateForArtboard(board('mobile', 'MB12Annotate')).ui.annotating).toBe(true);
    expect(stateForArtboard(board('mobile', 'MB13Minimized')).presentation.minimized).toBe(true);
    expect(stateForArtboard(board('mobile', 'MB3People')).ui).toMatchObject({ sheet: 'people', panel: 'people' });
  });

  it('lets the query override props and pick the fixture', () => {
    const s = stateForArtboard(board('desktop', 'F1Bar-4roh-l8ju'), new URLSearchParams('panel=chat&people=one&chat=empty'));
    expect(s.ui.panel).toBe('chat');
    expect(s.participants).toHaveLength(1);
    expect(s.chat.everyone).toEqual([]);
    expect(parseQuery(new URLSearchParams('clock=live&people=nope&x=1'))).toEqual({
      options: { people: 'class', chat: 'default', liveClock: true },
      props: { people: 'nope', x: '1' },
    });
  });

  it('ignores unknown or malformed props', () => {
    const base = createRoom();
    expect(applyProps(base, { nothing: 'here', panel: 'kitchen', rooms: 'many' }, 'Focus')).toEqual(base);
    expect(applyProps(base, { rooms: 'many' }, 'Breakout').breakouts.roomCount).toBe(2);
  });
});
