/**
 * Screenshot baselines for every desktop route (PLAN.md › Milestone 5, exit
 * criterion 3): each artboard in src/routes/artboards.json at 1400×900,
 * compared with `toHaveScreenshot()` at a small tolerance. Animations are
 * disabled and the room clock is fixed (it only moves with `?clock=live`),
 * so a route renders the same at any time.
 *
 * The baselines live in e2e/visual.spec.ts-snapshots/ and come from CI's
 * Chromium: the `update-snapshots` workflow regenerates them and commits
 * them to the branch. A local Chromium renders text differently, so never
 * generate them locally. Until baselines exist for the current platform
 * the whole spec skips itself, so a fresh checkout and CI pass before the
 * first run of that workflow.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

type Artboard = {
  stem: string;
  group: 'desktop' | 'mobile';
  number: number;
  title: string;
  size: { width: number; height: number };
};

const artboards = (JSON.parse(readFileSync('src/routes/artboards.json', 'utf8')) as Artboard[]).filter(
  (a) => a.group === 'desktop',
);

const SIZE = { width: 1400, height: 900 };
const SNAPSHOT_DIR = join('e2e', 'visual.spec.ts-snapshots');

/** The platform suffix Playwright appends to a snapshot name, so a Linux baseline is not compared on a Mac. */
const platform = `${process.platform}`;

/** True when at least one baseline for this platform (and the Chromium project) has been committed. */
function hasBaselines(): boolean {
  if (!existsSync(SNAPSHOT_DIR)) return false;
  return readdirSync(SNAPSHOT_DIR).some((f) => f.endsWith(`-chromium-${platform}.png`));
}

/** The update-snapshots workflow sets this so the first run can write baselines where none exist yet. */
const updating = process.env.VISUAL_UPDATE === '1';

test.describe('desktop routes match their baselines', () => {
  test.skip(
    !hasBaselines() && !updating,
    'No screenshot baselines for this platform yet: run the update-snapshots workflow.',
  );

  for (const a of artboards) {
    test(`${a.number} · ${a.stem}`, async ({ page }) => {
      await page.setViewportSize(SIZE);
      await page.goto(`/desktop/${a.stem}`);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      // Overlays open on load finish entering before the shot.
      await expect(page.locator('[data-entering]')).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${a.stem}.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
