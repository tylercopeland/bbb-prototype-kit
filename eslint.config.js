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

// A color hex token. Fragments such as href="#feed" are exempted by the
// parent check in the selectors below, since they cannot be told apart lexically.
const HEX = '#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z_-])';
// `utility-[…]` anywhere in a string, including an unclosed `bg-[#` quasi of a
// template literal. A bracket group followed by `:` is a variant
// (data-[focus-visible]:, aria-[pressed=true]:) and is allowed.
const ARBITRARY = '[a-z][a-z0-9-]*-\\[(?:[^\\]]*$|[^\\]]*\\](?!:))';
const ARBITRARY_PROPERTY = '(?:^|\\s)\\[[a-z-]+:[^\\]]*\\]';
const OPACITY_MODIFIER = '\\/\\[';
const COLOR_FUNCTION = '\\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\\(';
const PX_LENGTH = '\\b\\d+(?:\\.\\d+)?px\\b';
// Class-shaped escapes: `/N` opacity on a utility, the `-(--var)` shorthand and `-px`.
const OPACITY_NUMBER = '(?:^|\\s)[a-z][a-z0-9-]*-[a-z0-9-]+\\/\\d+(?=\\s|$)';
const VARIABLE_SHORTHAND = '[a-z][a-z0-9-]*-\\(';
const PX_UTILITY = '(?:^|\\s)[a-z][a-z0-9-]*-px(?=\\s|$)';
const URL_ATTRIBUTE = 'JSXAttribute[name.name=/^(href|to|id|htmlFor|src)$/]';
const NON_INTERACTIVE =
  'JSXOpeningElement[name.name=/^[a-z]/]:not([name.name=/^(button|a|input|select|textarea|label|summary)$/])';
const POINTER_HANDLER =
  'JSXAttribute[name.name=/^on(Click|DoubleClick|ContextMenu|Mouse\\w+|Pointer\\w+|Touch\\w+|Key\\w+)$/]';
const STYLE_OBJECT = 'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression';
const CSS_VARIABLE = '[value.type="Literal"][value.value=/^var\\(--[a-zA-Z0-9-]+\\)$/]';
const ZERO = '[value.type="Literal"][value.value=0]';

const messages = {
  hex: 'Raw hex color. Use a token utility, or add a token to src/tokens/tokens.json.',
  arbitrary: 'Arbitrary Tailwind value. Add a token to src/tokens/tokens.json.',
  colorFn: 'Raw color function. Use a token utility, or add a token to src/tokens/tokens.json.',
  px: 'Raw pixel length. Use a spacing or size token.',
  opacity: 'Opacity modifier on a color. Add a semantic color token instead.',
  style: 'Inline style values must be CSS variables (var(--…)) or 0; everything else needs a token utility.',
  handler: 'Use a React Aria component; no pointer or keyboard handlers on non-interactive elements.',
};

const forStrings = (pattern, message) => [
  { selector: `Literal[value=/${pattern}/]:not(${URL_ATTRIBUTE} > Literal)`, message },
  { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
];

const tokenSyntaxRules = [
  ...forStrings(HEX, messages.hex),
  ...forStrings(ARBITRARY, messages.arbitrary),
  ...forStrings(ARBITRARY_PROPERTY, messages.arbitrary),
  ...forStrings(OPACITY_MODIFIER, messages.arbitrary),
  ...forStrings(OPACITY_NUMBER, messages.opacity),
  ...forStrings(VARIABLE_SHORTHAND, messages.arbitrary),
  ...forStrings(PX_UTILITY, messages.px),
  ...forStrings(COLOR_FUNCTION, messages.colorFn),
  ...forStrings(PX_LENGTH, messages.px),
  {
    selector: 'JSXAttribute[name.name="style"] > JSXExpressionContainer > :not(ObjectExpression)',
    message: messages.style,
  },
  { selector: `${STYLE_OBJECT} > :not(Property)`, message: messages.style },
  { selector: `${STYLE_OBJECT} > Property:not(${CSS_VARIABLE}):not(${ZERO})`, message: messages.style },
  { selector: `${NON_INTERACTIVE} > ${POINTER_HANDLER}`, message: messages.handler },
  {
    selector: `${NON_INTERACTIVE} > JSXSpreadAttribute > ObjectExpression > Property[key.name=/^on(Click|DoubleClick|ContextMenu|Mouse\\w+|Pointer\\w+|Touch\\w+|Key\\w+)$/]`,
    message: messages.handler,
  },
];

export default tseslint.config(
  {
    ignores: [
      'dist',
      'storybook-static',
      'src/tokens/tokens.css',
      'playwright-report',
      'test-results',
      'node_modules',
    ],
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
    rules: {
      ...reactRefresh.configs.vite.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
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
            { pattern: '^(?:[^\\s:]+:)*[a-z-]+-\\[.+\\]$', message: messages.arbitrary },
            { pattern: '^(?:[^\\s:]+:)*\\[[a-z-]+:.+\\]$', message: messages.arbitrary },
            { pattern: '/\\[.+\\]$', message: messages.arbitrary },
            {
              pattern:
                '^(?:[^\\s:]+:)*(?:bg|text|border|ring|outline|fill|stroke|accent|caret|decoration|divide|placeholder|shadow|from|via|to)-[a-z0-9-]+/\\d+$',
              message: messages.opacity,
            },
            { pattern: '-\\(.+\\)$', message: messages.arbitrary },
            { pattern: '-px$', message: messages.px },
            {
              pattern: '-\\d+\\.\\d+$',
              message: 'Off-grid fractional spacing. Use whole steps of the 4px scale.',
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
    files: ['src/**/*.{ts,tsx}', '.storybook/**/*.tsx'],
    ignores: ['scripts/**', 'src/tokens/*.ts', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...tokenSyntaxRules],
    },
  },
);
