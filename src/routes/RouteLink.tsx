/**
 * A text link for the index and placeholder pages, on React Aria's `Link`.
 * Client-side navigation comes from the `RouterProvider` in `Root`, so an
 * `href` is a real URL (deep-linkable, middle-clickable) that still routes
 * without a reload.
 */
import { composeRenderProps, Link, type LinkProps } from 'react-aria-components';
import { tv } from '../styles/tv';

const routeLinkStyles = tv({
  base: 'inline-flex min-h-control-md items-center gap-2 rounded-control text-accent underline-offset-4 focus-ring data-hovered:underline data-pressed:underline',
  variants: {
    variant: {
      inline: 'text-md font-medium',
      row: 'w-full px-2 text-md',
    },
  },
  defaultVariants: { variant: 'inline' },
});

export interface RouteLinkProps extends Omit<LinkProps, 'className'> {
  variant?: 'inline' | 'row';
  className?: string;
}

export function RouteLink({ variant = 'inline', className, ...props }: RouteLinkProps) {
  return (
    <Link
      {...props}
      className={composeRenderProps(className, (cls) => routeLinkStyles({ variant, className: cls }))}
    />
  );
}
