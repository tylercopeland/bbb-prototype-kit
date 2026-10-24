import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidePanel } from './SidePanel';

function Subject(props: Partial<React.ComponentProps<typeof SidePanel>>) {
  return (
    <SidePanel
      panel="people"
      raisedHands={4}
      unread={2}
      people={<p>People content</p>}
      chat={
        <p>
          Chat content <button type="button">Send</button>
        </p>
      }
      {...props}
    />
  );
}

describe('SidePanel', () => {
  it('is a complementary landmark named after the panel, with the tabs above their panels (D3)', () => {
    render(<Subject />);
    expect(screen.getByRole('complementary', { name: 'People' })).toBeInTheDocument();
    const tabs = screen.getByRole('tablist', { name: 'People and chat' });
    expect(tabs).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'People 4 raised hands' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Chat 2 unread' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('People content');
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeInTheDocument();
  });

  it('is controlled: the arrow keys report a change, and the room decides', async () => {
    const user = userEvent.setup();
    const onPanelChange = vi.fn();
    const { rerender } = render(<Subject onPanelChange={onPanelChange} />);
    await user.tab();
    expect(screen.getByRole('tab', { name: /People/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(onPanelChange).toHaveBeenCalledWith('chat');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('People content');
    rerender(<Subject panel="chat" unread={0} />);
    expect(screen.getByRole('complementary', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Chat' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Chat content');
    // Tab moves from the selected tab into the panel's first control, then to Close.
    screen.getByRole('tab', { name: 'Chat' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close panel' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Send' })).toHaveFocus();
  });

  it('closes with Enter on the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Subject onClose={onClose} />);
    screen.getByRole('button', { name: 'Close panel' }).focus();
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows no badges at zero', () => {
    render(<Subject raisedHands={0} unread={0} />);
    expect(screen.getByRole('tab', { name: 'People' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows a plain title and the children for Notes and Poll', () => {
    render(
      <Subject panel="notes">
        <p>Notes body</p>
      </Subject>,
    );
    expect(screen.getByRole('complementary', { name: 'Shared notes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Shared notes');
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByText('Notes body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeInTheDocument();
  });

  it('merges a className', () => {
    render(<Subject className="w-96" />);
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-96');
    expect(aside).not.toHaveClass('w-panel');
  });
});
