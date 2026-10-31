import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomSettings } from './RoomSettings';

describe('RoomSettings', () => {
  it('shows the Private chat switch with its state and description', () => {
    const { rerender } = render(<RoomSettings privateChat />);
    const sw = screen.getByRole('switch', { name: 'Private chat' });
    expect(sw).toBeChecked();
    expect(sw).toHaveAccessibleDescription(/Students can message each other privately/);
    rerender(<RoomSettings privateChat={false} />);
    expect(sw).not.toBeChecked();
    expect(sw).toHaveAccessibleName('Private chat');
  });

  it('reports the change from a click and from Space, keeping its label', async () => {
    const user = userEvent.setup();
    const onPrivateChatChange = vi.fn();
    render(<RoomSettings privateChat onPrivateChatChange={onPrivateChatChange} />);
    await user.click(screen.getByText('Private chat'));
    expect(onPrivateChatChange).toHaveBeenLastCalledWith(false);
    screen.getByRole('switch', { name: 'Private chat' }).focus();
    await user.keyboard(' ');
    expect(onPrivateChatChange).toHaveBeenCalledTimes(2);
  });

  it('merges a className', () => {
    const { container } = render(<RoomSettings privateChat className="w-96" />);
    expect(container.firstElementChild).toHaveClass('w-96');
    expect(container.firstElementChild).not.toHaveClass('w-72');
  });
});
