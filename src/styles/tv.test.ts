import { describe, expect, it } from 'vitest';
import { tv } from './tv';

describe('tv merge config', () => {
  const styles = tv({
    base: 'h-control-md w-control-md rounded-control bg-surface text-xs',
  });

  it('lets a consumer className override the token-scale classes', () => {
    expect(styles({ className: 'rounded-full h-control-lg' })).toBe(
      'w-control-md bg-surface text-xs rounded-full h-control-lg',
    );
  });

  it('merges colors, text sizes and size-* over h-*/w-* as well', () => {
    const result = styles({ className: 'bg-accent text-md size-icon-sm' });
    expect(result).not.toContain('bg-surface');
    expect(result).not.toContain('text-xs');
    expect(result).not.toContain('h-control-md');
    expect(result).not.toContain('w-control-md');
    expect(result).toContain('bg-accent text-md size-icon-sm');
  });

  it('resolves conflicts between extended variants', () => {
    const base = tv({ variants: { size: { sm: 'h-control-sm px-3' } } });
    const extended = tv({ extend: base, variants: { size: { sm: 'w-control-sm p-0' } } });
    expect(extended({ size: 'sm' })).toBe('h-control-sm w-control-sm p-0');
  });
});
