// Flat ESLint config. Three layers guard the token rules
// (docs/plans/m1-foundations.md §7):
//   1. eslint-plugin-better-tailwindcss: arbitrary values and unknown classes
//      in className strings, template literals and tv()/cn()/clsx() calls
//   2. no-restricted-syntax: raw hex and arbitrary values in any string
//   3. no-restricted-syntax: pointer and keyboard handlers on div and span
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import storybook from 'eslint-plugin-storybook';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import globals from 'globals';

const HEX = '#[0-9a-fA-F]{3,8}\\b';
const ARBITRARY = '\\b[a-z-]+-\\[[^\\]]+\\]';

const tokenSyntaxRules = [
  {
    selector: `Literal[value=/${HEX}/]`,
    message: 'Raw hex color. Use a token utility, or add a token to src/tokens/tokens.json.',
  },
  {
    selector: `TemplateElement[value.raw=/${HEX}/]`,
    message: 'Raw hex color. Use a token utility, or add a token to src/tokens/tokens.json.',
  },
  {
    selector: `Literal[value=/${ARBITRARY}/]`,
    message: 'Arbitrary Tailwind value. Add a token to src/tokens/tokens.json.',
  },
  {
    selector: `TemplateElement[value.raw=/${ARBITRARY}/]`,
    message: 'Arbitrary Tailwind value. Add a token to src/tokens/tokens.json.',
  },
  {
    selector:
      'JSXOpeningElement[name.name=/^(div|span)$/] > JSXAttribute[name.name=/^on(Click|MouseDown|MouseUp|KeyDown|KeyUp|KeyPress)$/]',
    message: 'Use a React Aria component; no handlers on div or span.',
  },
];

export default tseslint.config(
  {
    ignores: ['dist', 'storybook-static', 'src/tokens/tokens.css', 'playwright-report', 'test-results', 'node_modules'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ...reactRefresh.configs.vite,
  },
  ...storybook.configs['flat/recommended'],
  // Layer 1: Tailwind classes resolved against the real theme.
  {
    files: ['src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/theme.css',
        // tv, cn and clsx are in the plugin's default callee matchers, which also
        // lint object values inside tv({ base, variants }). A plain string list
        // here would replace them with string-argument matching only.
      },
    },
    rules: {
      'better-tailwindcss/no-restricted-classes': [
        'error',
        {
          restrict: [
            {
              pattern: '^(?:[a-z-]+:)*[a-z-]+-\\[.+\\]$',
              message: 'Arbitrary Tailwind value. Add a token to src/tokens/tokens.json.',
            },
          ],
        },
      ],
      'better-tailwindcss/no-unknown-classes': 'error',
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
    },
  },
  // Layers 2 and 3: raw hex, arbitrary values in any string, handlers on div/span.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['scripts/**', 'src/tokens/*.ts', '**/*.test.ts', '**/*.test.tsx', '.storybook/**'],
    rules: {
      'no-restricted-syntax': ['error', ...tokenSyntaxRules],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
