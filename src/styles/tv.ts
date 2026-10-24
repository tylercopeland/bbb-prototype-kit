/**
 * The project's `tv()`: tailwind-variants with a merge config that knows
 * the token scales, so a consumer className overrides the matching class
 * instead of sitting next to it (`rounded-full` replaces `rounded-control`,
 * `h-control-lg` replaces `h-control-md`). Components import `tv` from here,
 * never from 'tailwind-variants'.
 *
 * Colors and text sizes already merge: tailwind-merge treats any `bg-x` /
 * `text-x` as a color and any t-shirt size as a font size. It cannot guess
 * the custom names of the other token scales, so every one of them is
 * listed below: radius, spacing, font weight, letter spacing, container
 * width and shadow. When tokens.json gains a name in one of these scales, add it here
 * and a case to tv.test.ts.
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

export const fontWeightScale = ['regular', 'medium', 'semibold', 'bold'];

export const trackingScale = ['label'];

export const containerScale = ['page'];

export const shadowScale = ['overlay'];

export const tv = createTV({
  twMergeConfig: {
    extend: {
      theme: {
        radius: radiusScale,
        spacing: spacingScale,
        'font-weight': fontWeightScale,
        tracking: trackingScale,
        container: containerScale,
        shadow: shadowScale,
      },
    },
  },
});

export type { VariantProps } from 'tailwind-variants';
