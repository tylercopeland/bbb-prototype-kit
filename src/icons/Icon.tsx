import { icons, type IconName } from './icons';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg';

/** 12 / 16 / 20 / 24px, from the `component.icon.*` tokens. */
const sizeClass: Record<IconSize, string> = {
  xs: 'size-icon-xs',
  sm: 'size-icon-sm',
  md: 'size-icon-md',
  lg: 'size-icon-lg',
};

export interface IconProps {
  name: IconName;
  size?: IconSize;
  /** Given only when the icon stands alone: it becomes `role="img"` with this name. Otherwise it is hidden. */
  label?: string;
  className?: string;
}

/** One glyph from the icon set. Decorative by default; `data-icon` names it for tests. */
export function Icon({ name, size = 'md', label, className }: IconProps) {
  const Glyph = icons[name];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <Glyph
      data-icon={name}
      className={['shrink-0', sizeClass[size], className].filter(Boolean).join(' ')}
      {...a11y}
    />
  );
}
