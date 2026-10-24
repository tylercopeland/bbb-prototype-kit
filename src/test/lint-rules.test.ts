/**
 * Proves the token lint rules (eslint.config.js) reject what CLAUDE.md
 * forbids, without keeping a failing story in the repo. Each fixture is a
 * JSX element linted through the ESLint Node API under a virtual story path.
 */
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

// Vitest runs from the project root, where eslint.config.js lives.
const repoRoot = process.cwd();
const filePath = 'src/components/Fixture.stories.tsx';
const eslint = new ESLint({ cwd: repoRoot });
const timeout = 30_000;

type Fixture = { name: string; attrs: string; tag?: string; rule?: string; message?: RegExp };

async function lintSource(source: string) {
  const [result] = await eslint.lintText(source, { filePath });
  return result.messages.filter((m) => m.severity === 2 && !/no-unused-vars/.test(m.ruleId ?? ''));
}

async function lintElement({ attrs, tag = 'div' }: Fixture) {
  const imports =
    tag === 'Button' ? "import { Button, composeRenderProps } from 'react-aria-components';\n" : '';
  return lintSource(`${imports}export default { title: 'Fixture' };
const c = 'x';
const x = 1;
const s = {};
const buttonStyles = (o: { className?: string }) => o.className ?? '';
const cn = (v: string) => v;
export const Fixture = () => <${tag} ${attrs} />;
`);
}

const rejected: Fixture[] = [
  {
    name: 'bg-[#ff0000]',
    attrs: 'className="bg-[#ff0000]"',
    rule: 'better-tailwindcss/no-restricted-classes',
  },
  { name: 'bg-[#ff0000] in layer 2', attrs: 'className="bg-[#ff0000]"', rule: 'no-restricted-syntax' },
  { name: 'p-[13px]', attrs: 'className="p-[13px]"', rule: 'better-tailwindcss/no-restricted-classes' },
  { name: 'raw hex in a style object', attrs: "style={{ color: '#ff0000' }}", message: /Raw hex color/ },
  { name: 'onClick on a div', attrs: 'onClick={() => {}}', message: /no pointer or keyboard handlers/ },
  {
    name: 'onPointerDown on a div',
    attrs: 'onPointerDown={() => {}}',
    message: /no pointer or keyboard handlers/,
  },
  {
    name: 'onClick on an li',
    attrs: 'onClick={() => {}}',
    tag: 'li',
    message: /no pointer or keyboard handlers/,
  },
  {
    name: 'an unknown class',
    attrs: 'className="bg-canvas-blue"',
    rule: 'better-tailwindcss/no-unknown-classes',
  },
  {
    name: 'an interpolated hex template',
    attrs: 'className={`bg-[#${c}]`}',
    message: /Arbitrary Tailwind value/,
  },
  {
    name: 'an interpolated px template',
    attrs: 'className={`p-[${x}px]`}',
    message: /Arbitrary Tailwind value/,
  },
  {
    name: 'an arbitrary property',
    attrs: 'className="[color:red]"',
    rule: 'better-tailwindcss/no-restricted-classes',
  },
  {
    name: 'an arbitrary opacity modifier',
    attrs: 'className="text-text/[0.13]"',
    rule: 'better-tailwindcss/no-restricted-classes',
  },
  { name: 'fractional spacing p-3.25', attrs: 'className="p-3.25"', message: /Off-grid fractional spacing/ },
  { name: 'fractional spacing mt-0.5', attrs: 'className="mt-0.5"', message: /Off-grid fractional spacing/ },
  {
    name: 'rgba() in a style object',
    attrs: "style={{ color: 'rgba(0,0,0,.5)' }}",
    message: /Raw color function/,
  },
  {
    name: 'oklch() in a style object',
    attrs: "style={{ color: 'oklch(0.5 0.1 200)' }}",
    message: /Raw color function/,
  },
  { name: 'a px length in a style object', attrs: "style={{ width: '12px' }}", message: /Raw pixel length/ },
  { name: 'a bare number in a style object', attrs: 'style={{ width: 12 }}', message: /Inline style values/ },
  { name: 'a style variable', attrs: 'style={s}', message: /Inline style values/ },
  {
    name: 'a spread in a style object',
    attrs: "style={{ ...s, width: 'var(--spacing-panel)' }}",
    message: /Inline style values/,
  },
  {
    name: 'hex inside a render-prop className',
    attrs: "className={({ isPressed }) => (isPressed ? 'bg-[#ff0000]' : 'bg-surface')}",
    tag: 'Button',
    message: /Raw hex color/,
  },
  {
    name: 'a bracket value inside a render-prop className',
    attrs: "className={({ isPressed }) => (isPressed ? 'p-[13px]' : 'bg-surface')}",
    tag: 'Button',
    message: /Arbitrary Tailwind value/,
  },
  {
    name: 'an arbitrary value behind a variant',
    attrs: 'className="data-[focus-visible]:bg-[#fff]"',
    message: /Raw hex color/,
  },
  { name: 'a numeric opacity modifier', attrs: 'className="text-text/13"', message: /Opacity modifier/ },
  {
    name: 'the CSS variable shorthand',
    attrs: 'className="bg-(--bbb-x)"',
    rule: 'better-tailwindcss/no-restricted-classes',
  },
  {
    name: 'the typed CSS variable shorthand',
    attrs: 'className="bg-(color:--x)"',
    message: /Arbitrary Tailwind value/,
  },
  {
    name: 'a handler in an inline spread',
    attrs: '{...{ onClick: () => 1 }}',
    message: /no pointer or keyboard handlers/,
  },
  { name: 'mt-px', attrs: 'className="mt-px"', message: /Raw pixel length/ },
  {
    name: 'a function-form className',
    attrs: "className={({ isPressed }) => 'bg-surface'}",
    tag: 'Button',
    message: /Route render-prop classNames through tv\(\)/,
  },
  {
    name: 'a function-expression className',
    attrs: "className={function () { return 'bg-surface'; }}",
    tag: 'Button',
    message: /Route render-prop classNames through tv\(\)/,
  },
  { name: 'a bare variable as className', attrs: 'className={c}', message: /bare variable as className/ },
  {
    name: 'a composeRenderProps callback that returns a string',
    attrs: "className={composeRenderProps(c, (x) => 'bg-surface')}",
    tag: 'Button',
    message: /callback must be/,
  },
  {
    name: 'a composeRenderProps callback that calls something other than a tv() result',
    attrs: 'className={composeRenderProps(c, (x) => cn(x))}',
    tag: 'Button',
    message: /callback must be/,
  },
  {
    name: 'a composeRenderProps callback with a block body',
    attrs: 'className={composeRenderProps(c, (x) => { return buttonStyles({ className: x }); })}',
    tag: 'Button',
    message: /callback must be/,
  },
  {
    name: 'a raw data-surface attribute',
    attrs: 'data-surface="stage"',
    message: /Write data-surface only in Surface/,
  },
];

/** Whole-module fixtures, for rules that apply outside a JSX attribute. */
const rejectedSources: Array<{ name: string; source: string; rule: string }> = [
  {
    name: 'an arbitrary value inside a tv() object',
    source: `import { tv } from 'tailwind-variants';
export const styles = tv({ base: 'bg-[#fff]' });
`,
    rule: 'better-tailwindcss/no-restricted-classes',
  },
  {
    name: 'an unknown class inside a tv() variant',
    source: `import { tv } from 'tailwind-variants';
export const styles = tv({ base: 'flex', variants: { tone: { danger: 'bg-canvas-red' } } });
`,
    rule: 'better-tailwindcss/no-unknown-classes',
  },
];

const accepted: Fixture[] = [
  { name: 'token utilities', attrs: 'className="bg-surface rounded-md h-control-md focus-ring"' },
  {
    name: 'React Aria data and aria variants',
    attrs:
      'className="data-[orientation=vertical]:flex aria-[pressed=true]:bg-accent data-[focus-visible]:bg-accent"',
  },
  { name: 'a URL fragment', attrs: 'href="#feed"', tag: 'a' },
  {
    name: 'CSS variables and 0 in a style object',
    attrs: "style={{ width: 'var(--spacing-panel)', margin: 0 }}",
  },
  { name: 'onClick on a button', attrs: 'onClick={() => {}}', tag: 'button' },
  { name: 'spacing, breakpoints and sizes', attrs: 'className="p-2 sm:grid-cols-4 size-16"' },
  {
    name: 'a className composed with composeRenderProps and a tv() result',
    attrs: 'className={composeRenderProps(c, (x) => buttonStyles({ className: x }))}',
    tag: 'Button',
  },
  { name: 'a className from a tv() call', attrs: 'className={buttonStyles({ className: c })}' },
];

describe('token lint rules reject', () => {
  for (const fixture of rejected) {
    it(fixture.name, { timeout }, async () => {
      const errors = await lintElement(fixture);
      expect(errors.length).toBeGreaterThan(0);
      if (fixture.rule) expect(errors.map((e) => e.ruleId)).toContain(fixture.rule);
      if (fixture.message) expect(errors.some((e) => fixture.message?.test(e.message))).toBe(true);
    });
  }
});

describe('token lint rules reject, in whole modules', () => {
  for (const fixture of rejectedSources) {
    it(fixture.name, { timeout }, async () => {
      const errors = await lintSource(fixture.source);
      expect(errors.map((e) => e.ruleId)).toContain(fixture.rule);
    });
  }
});

describe('token lint rules accept', () => {
  for (const fixture of accepted) {
    it(fixture.name, { timeout }, async () => {
      expect(await lintElement(fixture)).toEqual([]);
    });
  }
});
