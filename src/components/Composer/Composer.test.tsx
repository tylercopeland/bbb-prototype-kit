import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Announcer } from '../Announcer';
import { createRoom, createRoomStore, RoomProvider } from '../../mocks';
import { Composer } from './Composer';

function setup(
  props: Partial<React.ComponentProps<typeof Composer>> = {},
  people: 'class' | 'longNames' | 'duplicateNames' = 'class',
) {
  const store = createRoomStore(createRoom({ participants: people }));
  const utils = render(
    <Announcer>
      <RoomProvider store={store}>
        <Composer {...props} />
      </RoomProvider>
    </Announcer>,
  );
  return { store, ...utils };
}

describe('Composer', () => {
  it('is named "Message everyone" and sends to everyone from the local person on Enter', async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    const { store } = setup({ onSent });
    const field = screen.getByRole('textbox', { name: 'Message everyone' });
    await user.tab();
    expect(field).toHaveFocus();
    await user.keyboard('Can everyone see slide 3?{Enter}');
    const last = store.getState().chat.everyone.at(-1)!;
    expect(last).toMatchObject({ from: 'helena', text: 'Can everyone see slide 3?', read: true });
    expect(onSent).toHaveBeenCalledWith('Can everyone see slide 3?');
    expect(field).toHaveValue('');
    // Our own message is not announced.
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('names a private thread by the first name, shows the lock, and sends into that thread', async () => {
    const user = userEvent.setup();
    const { store } = setup({ to: 'rafaela' });
    const field = screen.getByRole('textbox', { name: 'Message Rafaela privately' });
    expect(field).toHaveAttribute('placeholder', 'Message Rafaela privately');
    expect(document.querySelector('[data-icon="private"]')).not.toBeNull();
    await user.click(field);
    await user.keyboard('Yes, go ahead');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    const thread = store.getState().chat.direct.find((t) => t.with === 'rafaela')!;
    expect(thread.messages.at(-1)).toMatchObject({ from: 'helena', text: 'Yes, go ahead' });
    expect(store.getState().chat.everyone).toHaveLength(3);
  });

  it('starts a thread that did not exist yet', async () => {
    const user = userEvent.setup();
    const { store } = setup({ to: 'frederick' });
    expect(store.getState().chat.direct.some((t) => t.with === 'frederick')).toBe(false);
    await user.click(screen.getByRole('textbox', { name: 'Message Frederick privately' }));
    await user.keyboard('Ready to share?{Enter}');
    expect(store.getState().chat.direct.find((t) => t.with === 'frederick')?.messages).toHaveLength(1);
  });

  it('sends nothing for an empty message, and Shift + Enter adds a line', async () => {
    const user = userEvent.setup();
    const { store } = setup();
    const before = store.getState();
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Enter}');
    await user.keyboard('one{Shift>}{Enter}{/Shift}two');
    expect(screen.getByRole('textbox')).toHaveValue('one\ntwo');
    expect(store.getState()).toBe(before);
  });

  it('uses the first word of a long name and forwards its ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    setup({ to: 'rafaela', ref }, 'longNames');
    expect(screen.getByRole('textbox', { name: 'Message Rafaela privately' })).toBe(ref.current);
  });

  it('tells two Anas apart in its name (B9)', () => {
    setup({ to: 'ana-ferreira' }, 'duplicateNames');
    expect(screen.getByRole('textbox', { name: 'Message Ana F. privately' })).toBeInTheDocument();
  });
});
