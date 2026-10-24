/**
 * The project's `tv()`: tailwind-variants with a merge config that knows
 * the token scales, so a consumer className overrides the matching class
 * instead of sitting next to it (`rounded-full` replaces `rounded-control`,
 * `h-control-lg` replaces `h-control-md`). Components import `tv` from here,
 * never from 'tailwind-variants'.
 *
 * Colors and text sizes already merge: tailwind-merge treats any `bg-x` /
 * `text-x` as a color and any t-shirt size as a font size. The custom
 * radius and spacing names below are what it cannot guess.
 */
import { createTV } from 'tailwind-variants';

export const radiusScale = ['xs', 'md', 'lg', 'xl', 'full', 'control', 'panel', 'tile'];

export const spacingScale = [
  'control-sm',
  'control-md',
  'control-lg',
  'control-touch',
  'avatar-sm',
  'avatar-md',
  'avatar-lg',
  'icon-xs',
  'icon-sm',
  'icon-md',
  'icon-lg',
  'speaking-ring',
  'row',
  'panel',
];

export const tv = createTV({
  twMergeConfig: {
    extend: {
      theme: {
        radius: radiusScale,
        spacing: spacingScale,
      },
    },
  },
});

export type { VariantProps } from 'tailwind-variants';
