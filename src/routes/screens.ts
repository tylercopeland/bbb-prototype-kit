/**
 * Which artboards have a screen component, and which milestone builds the
 * rest. A route without a `Screen` renders the "Not built yet" placeholder,
 * so every route exists from day one and axe scans all of them. Milestone 4
 * batch B registers the F1, G1–G5 and L1 screens here; milestone 5 the other
 * desktop artboards; milestone 6 the phone ones.
 */
import type { ComponentType } from 'react';
import type { Artboard } from './artboards';

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

/** Screens registered as they are built, by `<group>/<stem>`. */
const screens: Record<string, ComponentType> = {};

export function registerScreen(group: Artboard['group'], stem: string, Screen: ComponentType): void {
  screens[`${group}/${stem}`] = Screen;
}

export function screenFor(artboard: Pick<Artboard, 'group' | 'stem'>): ScreenEntry {
  const milestone = artboard.group === 'mobile' ? 6 : MILESTONE_4.has(artboard.stem) ? 4 : 5;
  const Screen = screens[`${artboard.group}/${artboard.stem}`];
  return Screen ? { milestone, Screen } : { milestone };
}
