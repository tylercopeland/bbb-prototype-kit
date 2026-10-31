/**
 * Screenshot baselines for every route (PLAN.md › Milestone 5, exit
 * criterion 3; Milestone 6): each desktop artboard in
 * src/routes/artboards.json at 1400×900 and each phone artboard at its
 * own size (390×844 or 844×390), compared with `toHaveScreenshot()` at a
 * small tolerance. Animations are disabled and the room clock is fixed (it
 * only moves with `?clock=live`), so a route renders the same at any time.
 *
 * The baselines live in e2e/visual.spec.ts-snapshots/ and come from CI's
 * Chromium: the `update-snapshots` workflow regenerates them and commits
 * them to the branch. A local Chromium renders text differently, so never
 * generate them locally. Until baselines exist for the current platform a
 * group skips itself, so a fresh checkout and CI pass before the first run
 * of that workflow; the phone's names carry a `mobile-` prefix, so the
 * phone group waits for its own baselines while the desktop ones compare.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';

type Artboard = {
  stem: string;
  group: 'desktop' | 'mobile';
  number: number;
  title: string;
  size: { width: number; height: number };
};

const artboards = JSON.parse(readFileSync('src/routes/artboards.json', 'utf8')) as Artboard[];
const desktop = artboards.filter((a) => a.group === 'desktop');
const mobile = artboards.filter((a) => a.group === 'mobile');

const DESKTOP_SIZE = { width: 1400, height: 900 };
const SNAPSHOT_DIR = join('e2e', 'visual.spec.ts-snapshots');
/** The phone baselines' prefix, so a phone name never collides with a desktop one. */
const MOBILE_PREFIX = 'mobile-';

/** The platform suffix Playwright appends to a snapshot name, so a Linux baseline is not compared on a Mac. */
const platform = `${process.platform}`;

/** True when at least one baseline of this group for this platform (and the Chromium project) has been committed. */
function hasBaselines(group: Artboard['group']): boolean {
  if (!existsSync(SNAPSHOT_DIR)) return false;
  return readdirSync(SNAPSHOT_DIR).some(
    (f) => f.endsWith(`-chromium-${platform}.png`) && f.startsWith(MOBILE_PREFIX) === (group === 'mobile'),
  );
}

/** The update-snapshots workflow sets this so the first run can write baselines where none exist yet. */
const updating = process.env.VISUAL_UPDATE === '1';

async function shoot(page: Page, a: Artboard, name: string) {
  await page.goto(`/${a.group}/${a.stem}`);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  // Overlays open on load finish entering before the shot. React Aria hides a modal (opacity 0 and a
  // clip-path) until it is ready to enter, and on a touch device with an autofocused field (MB17) it
  // waits for the on-screen keyboard first, so the shot also waits for that hidden state to clear.
  await expect(page.locator('[style*="inset(50%)"]')).toHaveCount(0);
  await expect(page.locator('[data-entering]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
    fullPage: false,
    maxDiffPixelRatio: 0.01,
  });
}

test.describe('desktop routes match their baselines', () => {
  test.skip(
    !hasBaselines('desktop') && !updating,
    'No desktop screenshot baselines for this platform yet: run the update-snapshots workflow.',
  );

  for (const a of desktop) {
    test(`${a.number} · ${a.stem}`, async ({ page }) => {
      await page.setViewportSize(DESKTOP_SIZE);
      await shoot(page, a, `${a.stem}.png`);
    });
  }
});

test.describe('mobile routes match their baselines', () => {
  test.use({ hasTouch: true, isMobile: true });
  test.skip(
    !hasBaselines('mobile') && !updating,
    'No phone screenshot baselines for this platform yet: run the update-snapshots workflow.',
  );

  for (const a of mobile) {
    test(`${a.number} · ${a.stem} at ${a.size.width}×${a.size.height}`, async ({ page }) => {
      await page.setViewportSize(a.size);
      await shoot(page, a, `${MOBILE_PREFIX}${a.stem}.png`);
    });
  }
});
