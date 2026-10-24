import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';
import { icons } from './icons';

describe('Icon', () => {
  it('is hidden from assistive technology by default and names the glyph in data-icon', () => {
    const { container } = render(<Icon name="microphoneOff" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('data-icon', 'microphoneOff');
    expect(svg).toHaveClass('size-icon-md');
  });

  it('becomes an image with a name when a label is given', () => {
    render(<Icon name="speaking" label="Speaking" size="xs" />);
    const img = screen.getByRole('img', { name: 'Speaking' });
    expect(img).not.toHaveAttribute('aria-hidden');
    expect(img).toHaveClass('size-icon-xs');
  });

  it('maps every meaning to a distinct glyph (X6)', () => {
    const glyphs = Object.values(icons);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});
