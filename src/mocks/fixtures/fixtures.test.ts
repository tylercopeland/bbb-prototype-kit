import { describe, expect, it } from 'vitest';
import { createRoom, participantFixtures, type ParticipantFixture } from './index';

describe('fixtures', () => {
  it.each<[ParticipantFixture, number]>([
    ['one', 1],
    ['four', 4],
    ['class', 14],
    ['thirty', 30],
    ['longNames', 14],
    ['duplicateNames', 15],
  ])('%s has %i participants with unique ids and exactly one self', (name, count) => {
    const people = participantFixtures[name];
    expect(people).toHaveLength(count);
    expect(new Set(people.map((p) => p.id)).size).toBe(count);
    expect(people.filter((p) => p.isSelf)).toHaveLength(1);
    expect(people.filter((p) => p.isPresenter)).toHaveLength(1);
  });

  it('reproduces the canvas class names and states', () => {
    const { participants } = createRoom();
    const by = Object.fromEntries(participants.map((p) => [p.id, p]));
    expect(participants.map((p) => p.name)).toEqual([
      'Prof. Helena Costa',
      'Bruno',
      'Rafaela Monaco',
      'Cibelle Maciel',
      'Octavio',
      'Frederick Dixon',
      'Anton Georgiev',
      'Michelle Winkler',
      'Ellen',
      'Timo',
      'Marta Ribeiro',
      'Lucas Pereira',
      'Ana Souza',
      'Joana Lima',
    ]);
    expect(by.helena).toMatchObject({ role: 'teacher', audio: 'live', camera: true, isPresenter: true });
    expect(by.frederick).toMatchObject({ audio: 'speaking', camera: true });
    expect(by.ellen.audio).toBe('listening');
    expect(by.timo).toMatchObject({ audio: 'notJoined', engagement: { level: 'low' } });
    expect(by.lucas).toMatchObject({ audio: 'notJoined', camera: true });
    expect(participants.filter((p) => p.handRaisedAt !== null).map((p) => p.id)).toEqual([
      'bruno',
      'rafaela',
      'cibelle',
      'octavio',
    ]);
  });

  it('has long names and two Anas where asked', () => {
    const long = participantFixtures.longNames.map((p) => p.name.length);
    expect(Math.max(...long)).toBeGreaterThan(35);
    const anas = participantFixtures.duplicateNames.filter((p) => p.name.startsWith('Ana '));
    expect(anas).toHaveLength(2);
  });

  it('builds a complete room with a chat that only names people in the room', () => {
    const full = createRoom();
    expect(full.chat.everyone).toHaveLength(3);
    expect(full.chat.direct.map((t) => t.with)).toEqual(['bruno', 'rafaela']);
    expect(full.alerts).toHaveLength(1);
    const solo = createRoom({ participants: 'one' });
    expect(solo.chat.everyone.map((m) => m.from)).toEqual(['helena']);
    expect(solo.chat.direct).toEqual([]);
    expect(solo.alerts).toEqual([]);
    const empty = createRoom({ chat: 'empty' });
    expect(empty.chat.everyone).toEqual([]);
    expect(empty.alerts).toEqual([]);
    expect(createRoom({ ui: { panel: 'people' } }).ui.panel).toBe('people');
  });
});
