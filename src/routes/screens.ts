/**
 * Which artboards have a screen component, and which milestone builds the
 * rest. A route without a `Screen` renders the "Not built yet" placeholder,
 * so every route exists from day one and axe scans all of them. Milestone 4
 * batch B registers the F1, G1–G5 and L1 screens here; milestone 5 the other
 * desktop artboards; milestone 6 the phone ones.
 */
import type { ComponentType } from 'react';
import type { Artboard } from './artboards';
import { RoomScreen } from './room/RoomScreen';

export interface ScreenEntry {
  /** The milestone that builds this artboard (PLAN.md). */
  milestone: number;
  /** The component that renders it from the store, once built. */
  Screen?: ComponentType;
}

/** The desktop artboards milestone 4 wires to the store: the room, People, Chat and DMs, and the insight filter. */
const MILESTONE_4 = new Set([
  'F1Bar-4roh-l8ju',
  'G1People-my6z',
  'G2ChatEveryone-gqvt',
  'G3ChatDirect-56ch',
  'G4DmRafaela-gtn4',
  'G5DmFromPeople-ogjp',
  'L1LowEngagement-qeqx',
]);

/** Milestone 5 batch A: sharing, media, the slides overview, plugins, analytics and student actions, all states of the room. */
const MILESTONE_5A = new Set([
  'M1ShareScreen-k5tp',
  'M2ShareDeck-581i',
  'N1Overview-xpbk',
  'H1MediaSlides-2x0x',
  'H2MediaScreen-ez5s',
  'O1Analytics',
  'O2StudentActions',
  'BO1Entry-desk',
]);

/** Screens registered as they are built, by `<group>/<stem>`. */
const screens: Record<string, ComponentType> = {};

export function registerScreen(group: Artboard['group'], stem: string, Screen: ComponentType): void {
  screens[`${group}/${stem}`] = Screen;
}

// Milestone 4: the room shell renders every Focus artboard of the set from the store.
for (const stem of MILESTONE_4) registerScreen('desktop', stem, RoomScreen);
// Milestone 5 batch A: the same screen, with the pickers, overview, sharing and menus from the store.
for (const stem of MILESTONE_5A) registerScreen('desktop', stem, RoomScreen);

export function screenFor(artboard: Pick<Artboard, 'group' | 'stem'>): ScreenEntry {
  const milestone = artboard.group === 'mobile' ? 6 : MILESTONE_4.has(artboard.stem) ? 4 : 5;
  const Screen = screens[`${artboard.group}/${artboard.stem}`];
  return Screen ? { milestone, Screen } : { milestone };
}
