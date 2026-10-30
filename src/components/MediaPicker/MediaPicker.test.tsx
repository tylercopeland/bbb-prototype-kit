import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { decks } from '../../mocks';
import { MediaPicker } from './MediaPicker';

function Subject(props: Partial<React.ComponentProps<typeof MediaPicker>>) {
  return <MediaPicker decks={decks} deckIndex={0} mediaType="slides" {...props} />;
}

describe('MediaPicker', () => {
  it('is one tab list of the six types, after its panel in the DOM, with the open type selected', () => {
    render(<Subject />);
    const tabs = screen.getByRole('tablist', { name: 'Media type' });
    expect(
      within(tabs)
        .getAllByRole('tab')
        .map((t) => t.textContent),
    ).toEqual(['Slides', 'Video', 'Screen', 'Audio', 'URL', 'More']);
    expect(within(tabs).getByRole('tab', { name: 'Slides' })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(panel.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('Slides: Add slides opens the file picker, and the decks are a radio group with the presented one checked', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const { container } = render(<Subject onPick={onPick} />);
    const add = screen.getByRole('button', { name: 'Add slides' });
    expect(add).toHaveAccessibleDescription('PDF, PowerPoint or images');
    const group = screen.getByRole('radiogroup', { name: 'Your decks' });
    const cards = within(group).getAllByRole('radio');
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Present bbb-4-refined.pdf',
      'Present hack-week-kickoff.pdf',
      'Present research-readout.pdf',
    ]);
    expect(cards[0]).toBeChecked();
    expect(cards[0].querySelector('[data-icon="check"]')).not.toBeNull();
    expect(cards[1].querySelector('[data-icon="check"]')).toBeNull();
    await user.click(cards[1]);
    expect(onPick).toHaveBeenCalledWith({ type: 'deck', index: 1 });
    await user.click(cards[0]);
    expect(onPick).toHaveBeenCalledTimes(1);

    const input = container.querySelector('input[type="file"]')!;
    await user.upload(
      input as HTMLInputElement,
      new File(['%PDF'], 'lesson-2.pdf', { type: 'application/pdf' }),
    );
    expect(onPick).toHaveBeenLastCalledWith({ type: 'addDeck', file: 'lesson-2.pdf' });
  });

  it('switches the type with a click and with the arrow keys, through the owner', async () => {
    const user = userEvent.setup();
    const onMediaTypeChange = vi.fn();
    render(<Subject onMediaTypeChange={onMediaTypeChange} />);
    await user.click(screen.getByRole('tab', { name: 'Screen' }));
    expect(onMediaTypeChange).toHaveBeenLastCalledWith('screen');
    screen.getByRole('tab', { name: 'Slides' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onMediaTypeChange).toHaveBeenLastCalledWith('video');
    await user.keyboard('{End}');
    expect(onMediaTypeChange).toHaveBeenLastCalledWith('more');
  });

  it('Screen: the three kinds, the tab one noting audio', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<Subject mediaType="screen" onPick={onPick} />);
    expect(screen.getByRole('tab', { name: 'Screen' })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(
      within(panel)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Entire screen', 'A window', 'A browser tabCan include tab audio']);
    expect(within(panel).getByRole('button', { name: 'A browser tab' })).toHaveAccessibleDescription(
      'Can include tab audio',
    );
    await user.click(within(panel).getByRole('button', { name: 'A window' }));
    expect(onPick).toHaveBeenCalledWith({ type: 'screen', kind: 'A window' });
  });

  it('Video and URL: the action waits for a link; Audio starts at once; More lists the rest', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const { rerender } = render(<Subject mediaType="video" onPick={onPick} />);
    const share = screen.getByRole('button', { name: 'Share video' });
    expect(share).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Video link' }), 'https://example.com/clip.mp4');
    expect(share).toBeEnabled();
    await user.click(share);
    expect(onPick).toHaveBeenLastCalledWith({ type: 'video', url: 'https://example.com/clip.mp4' });
    expect(screen.getByRole('button', { name: 'Upload a file' })).toBeInTheDocument();

    rerender(<Subject mediaType="url" onPick={onPick} />);
    const open = screen.getByRole('button', { name: 'Open for everyone' });
    expect(open).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Web page' }), 'https://bigbluebutton.org');
    await user.keyboard('{Enter}');
    expect(onPick).toHaveBeenCalledTimes(1);
    await user.click(open);
    expect(onPick).toHaveBeenLastCalledWith({ type: 'url', url: 'https://bigbluebutton.org' });

    rerender(<Subject mediaType="audio" onPick={onPick} />);
    expect(screen.getByText('Share your computer’s audio')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start sharing' }));
    expect(onPick).toHaveBeenLastCalledWith({ type: 'audio' });

    rerender(<Subject mediaType="more" onPick={onPick} />);
    await user.click(screen.getByRole('button', { name: 'Poll' }));
    expect(onPick).toHaveBeenLastCalledWith({ type: 'poll' });
    await user.click(screen.getByRole('button', { name: 'From a plugin…' }));
    expect(onPick).toHaveBeenLastCalledWith({ type: 'plugins' });
    await user.click(screen.getByRole('button', { name: 'Blank whiteboard' }));
    expect(onPick).toHaveBeenLastCalledWith({ type: 'whiteboard' });
  });

  it('handles no decks and many decks', () => {
    const { rerender } = render(<Subject decks={[]} />);
    expect(screen.getByRole('button', { name: 'Add slides' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    const many = Array.from({ length: 30 }, (_, i) => ({
      file: `deck-${i + 1}.pdf`,
      slides: [`Deck ${i + 1}`],
    }));
    rerender(<Subject decks={many} deckIndex={29} />);
    const radios = within(screen.getByRole('radiogroup', { name: 'Your decks' })).getAllByRole('radio');
    expect(radios).toHaveLength(30);
    expect(radios[29]).toBeChecked();
  });

  it('reaches the decks and the type tabs with Tab, in that order', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Add slides' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Present bbb-4-refined.pdf' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('tab', { name: 'Slides' })).toHaveFocus();
  });

  it('merges a className onto the root', () => {
    const { container } = render(<Subject className="pt-2" />);
    expect(container.firstElementChild).toHaveClass('pt-2');
  });
});
