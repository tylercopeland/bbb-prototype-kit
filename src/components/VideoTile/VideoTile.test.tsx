import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoom, type Participant } from '../../mocks';
import { tileStatus, VideoTile } from './VideoTile';

const room = createRoom();
const by = (id: string): Participant => room.participants.find((p) => p.id === id)!;

describe('VideoTile', () => {
  it('is a figure named by the plate and a hidden status, with the speaking ring and badge (X12)', () => {
    render(<VideoTile participant={by('frederick')} shortName="Frederick" />);
    const tile = screen.getByRole('figure', { name: /^Frederick ?, speaking, camera on$/ });
    expect(tile).toHaveClass('ring-speaking', 'bg-surface-raised', 'h-24', 'w-42');
    expect(tile.querySelector('[data-icon="speaking"]')).not.toBeNull();
    expect(tile.querySelector('[data-icon="person"]')).not.toBeNull();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the muted and hand badges, and the avatar when the camera is off', () => {
    render(<VideoTile participant={by('cibelle')} shortName="Cibelle" />);
    const tile = screen.getByRole('figure', { name: /^Cibelle ?, muted, hand raised, camera off$/ });
    expect(tile).not.toHaveClass('ring-speaking');
    expect(tile.querySelector('[data-icon="raiseHand"]')).not.toBeNull();
    expect(tile.querySelector('[data-icon="microphoneOff"]')).not.toBeNull();
    expect(tile.querySelector('.size-avatar-lg')).not.toBeNull();
  });

  it('uses the 48px avatar at the grid size and the full name without a shortName', () => {
    render(<VideoTile participant={by('ellen')} size="grid" />);
    const tile = screen.getByRole('figure', { name: /^Ellen ?, listening only, camera off$/ });
    expect(tile).toHaveClass('aspect-video', 'w-full');
    expect(tile.querySelector('.size-avatar-xl')).not.toBeNull();
    expect(tile.querySelector('svg[data-icon]')).toBeNull();
  });

  it('is not focusable', async () => {
    const user = userEvent.setup();
    render(
      <>
        <VideoTile participant={by('bruno')} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('describes every audio state in words', () => {
    expect(tileStatus({ audio: 'live', camera: true, handRaisedAt: null })).toBe('microphone on, camera on');
    expect(tileStatus({ audio: 'notJoined', camera: false, handRaisedAt: 1 })).toBe('audio not joined, hand raised, camera off');
  });

  it('merges a className', () => {
    render(<VideoTile participant={by('bruno')} className="w-full" />);
    const tile = screen.getByRole('figure');
    expect(tile).toHaveClass('w-full');
    expect(tile).not.toHaveClass('w-42');
  });
});
