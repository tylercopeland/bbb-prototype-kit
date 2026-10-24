import { tv, type VariantProps } from '../styles/tv';
import { icons, type IconName } from './icons';

/** 12 / 16 / 20 / 24px, from the `component.icon.*` tokens. */
export const iconStyles = tv({
  base: 'shrink-0',
  variants: {
    size: {
      xs: 'size-icon-xs',
      sm: 'size-icon-sm',
      md: 'size-icon-md',
      lg: 'size-icon-lg',
    },
  },
  defaultVariants: { size: 'md' },
});

export type IconSize = NonNullable<VariantProps<typeof iconStyles>['size']>;

export interface IconProps {
  name: IconName;
  /** @default 'md' */
  size?: IconSize;
  /** Given only when the icon stands alone: it becomes `role="img"` with this name. Otherwise it is hidden. */
  label?: string;
  className?: string;
}

/** One glyph from the icon set. Decorative by default; `data-icon` names it for tests. */
export function Icon({ name, size = 'md', label, className }: IconProps) {
  const Glyph = icons[name];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return <Glyph data-icon={name} className={iconStyles({ size, className })} {...a11y} />;
}
