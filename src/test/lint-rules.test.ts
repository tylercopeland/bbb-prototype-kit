/**
 * Proves the token lint rules (eslint.config.js) reject what CLAUDE.md
 * forbids, without keeping a failing story in the repo. Each fixture is
 * linted through the ESLint Node API under a virtual story path.
 */
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

// Vitest runs from the project root, where eslint.config.js lives.
const repoRoot = process.cwd();
const filePath = 'src/components/Fixture.stories.tsx';
const eslint = new ESLint({ cwd: repoRoot });

async function lintErrors(fixture: string) {
  const source = `export default { title: 'Fixture' };\n${fixture}\n`;
  const [result] = await eslint.lintText(source, { filePath });
  return result.messages.filter((m) => m.severity === 2);
}

const timeout = 30_000;

describe('token lint rules', () => {
  it('rejects bg-[#ff0000]', { timeout }, async () => {
    const errors = await lintErrors('export const A = () => <div className="bg-[#ff0000]" />;');
    expect(errors.map((e) => e.ruleId)).toContain('better-tailwindcss/no-restricted-classes');
    expect(errors.map((e) => e.ruleId)).toContain('no-restricted-syntax');
  });

  it('rejects p-[13px]', { timeout }, async () => {
    const errors = await lintErrors('export const B = () => <div className="p-[13px]" />;');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a raw hex color in a style object', { timeout }, async () => {
    const errors = await lintErrors("export const C = () => <div style={{ color: '#ff0000' }} />;");
    expect(errors.map((e) => e.ruleId)).toContain('no-restricted-syntax');
  });

  it('rejects onClick on a div', { timeout }, async () => {
    const errors = await lintErrors('export const D = () => <div onClick={() => {}} />;');
    expect(errors.map((e) => e.message)).toContain('Use a React Aria component; no handlers on div or span.');
  });

  it('rejects an unknown class', { timeout }, async () => {
    const errors = await lintErrors('export const E = () => <div className="bg-canvas-blue" />;');
    expect(errors.map((e) => e.ruleId)).toContain('better-tailwindcss/no-unknown-classes');
  });

  it('rejects an arbitrary value inside tv()', { timeout }, async () => {
    const errors = await lintErrors(
      "import { tv } from 'tailwind-variants';\nexport const Styles = tv({ base: 'bg-[#123456]' });",
    );
    expect(errors.map((e) => e.ruleId)).toContain('better-tailwindcss/no-restricted-classes');
  });

  it('accepts token utilities', { timeout }, async () => {
    const errors = await lintErrors(
      'export const F = () => <div className="bg-surface rounded-md h-control-md focus-ring" />;',
    );
    expect(errors).toEqual([]);
  });
});
