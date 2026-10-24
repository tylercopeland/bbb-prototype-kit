import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avatar } from './Avatar';
import { avatarColor } from './avatarColor';

describe('Avatar', () => {
  it('is an image named after the person, showing derived initials', () => {
    render(<Avatar name="Rafaela Monaco" />);
    const avatar = screen.getByRole('img', { name: 'Rafaela Monaco' });
    expect(avatar).toHaveTextContent('RM');
    expect(avatar).toHaveClass('size-avatar-md', 'rounded-full', 'text-xs', 'font-bold', 'text-on-avatar');
  });

  it('is not focusable', async () => {
    const user = userEvent.setup();
    render(<Avatar name="Rafaela Monaco" />);
    const avatar = screen.getByRole('img', { name: 'Rafaela Monaco' });
    expect(avatar).not.toHaveAttribute('tabindex');
    await user.tab();
    expect(avatar).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });

  it('includes the status in its name', () => {
    render(
      <>
        <Avatar name="Frederick Dixon" isSpeaking />
        <Avatar name="Bruno" badge="muted" />
        <Avatar name="Cibelle Maciel" badge="hand" />
        <Avatar name="Octavio" badge="speaking" />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Frederick Dixon, speaking' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bruno, muted' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Cibelle Maciel, hand raised' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Octavio, speaking' })).toBeInTheDocument();
  });

  it('announces the badge state only when it also has the speaking ring', () => {
    render(<Avatar name="Bruno" isSpeaking badge="muted" />);
    expect(screen.getByRole('img', { name: 'Bruno, muted' })).toHaveClass('ring-speaking');
  });

  it('has no role or name when aria-hidden, because the row shows the name', () => {
    const { container } = render(<Avatar name="Rafaela Monaco" aria-hidden="true" />);
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    const span = container.firstElementChild;
    expect(span).toHaveAttribute('aria-hidden', 'true');
    expect(span).not.toHaveAttribute('aria-label');
    expect(span).toHaveTextContent('RM');
  });

  it('adds the speaking ring with isSpeaking', () => {
    const { rerender } = render(<Avatar name="Frederick Dixon" />);
    expect(screen.getByRole('img')).not.toHaveClass('ring-speaking');
    rerender(<Avatar name="Frederick Dixon" isSpeaking />);
    expect(screen.getByRole('img')).toHaveClass('ring-speaking');
  });

  it('renders the hand badge as a hidden icon on the amber disc', () => {
    render(<Avatar name="Cibelle Maciel" badge="hand" />);
    const icon = screen.getByRole('img').querySelector('svg');
    expect(icon).toHaveAttribute('data-icon', 'raiseHand');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveClass('size-icon-xs');
    expect(icon?.parentElement).toHaveClass(
      'bg-status-hand',
      'text-on-status-hand',
      'size-4',
      'rounded-full',
    );
  });

  it('colors by participantId, stably and distinctly for two Anas, and keeps the HTML id free', () => {
    render(
      <>
        <Avatar name="Ana" participantId="ana-souza" initials="AS" id="row-1-avatar" />
        <Avatar name="Ana" participantId="ana-lima" initials="AL" />
      </>,
    );
    const [souza, lima] = screen.getAllByRole('img', { name: 'Ana' });
    expect(souza).toHaveAttribute('id', 'row-1-avatar');
    expect(souza).toHaveTextContent('AS');
    expect(lima).toHaveTextContent('AL');
    expect(souza).toHaveClass(`bg-avatar-${avatarColor('ana-souza')}`);
    expect(lima).toHaveClass(`bg-avatar-${avatarColor('ana-lima')}`);
    expect(souza.className).not.toBe(lima.className);
  });

  it('shows the placeholder when the name leaves no initials, keeping the name', () => {
    render(<Avatar name="Dr." />);
    expect(screen.getByRole('img', { name: 'Dr.' })).toHaveTextContent('?');
  });

  it('takes a fixed color and the square shape', () => {
    render(<Avatar name="Helena Costa" color={4} shape="square" size="lg" />);
    const avatar = screen.getByRole('img', { name: 'Helena Costa' });
    expect(avatar).toHaveClass('bg-avatar-4', 'rounded-md', 'size-avatar-lg', 'text-md');
  });
});
