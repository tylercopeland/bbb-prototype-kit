import { describe, expect, it } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider } from 'react-router';
import type { RoomAction } from '../../mocks';
import { createTestRouter } from '../router';

function renderAt(path: string) {
  return render(<RouterProvider router={createTestRouter(path)} />);
}

/** Acts as another participant through the mounted store (`RoomProvider` exposes it as `window.bbbRoom`). */
function dispatch(action: RoomAction) {
  act(() => window.bbbRoom?.dispatch(action));
}

const F1 = '/desktop/F1Bar-4roh-l8ju';
const G1 = '/desktop/G1People-my6z';
const G2 = '/desktop/G2ChatEveryone-gqvt';
const G3 = '/desktop/G3ChatDirect-56ch';
const G4 = '/desktop/G4DmRafaela-gtn4';
const G5 = '/desktop/G5DmFromPeople-ogjp';
const L1 = '/desktop/L1LowEngagement-qeqx';

describe('RoomScreen', () => {
  it('F1: the header, alerts, stage and action bar from the store, with no panel', () => {
    renderAt(F1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hack Week: Brazil 2026');
    expect(screen.getByText(/14 people/)).toBeInTheDocument();
    const alerts = within(screen.getByRole('group', { name: 'Alerts' }));
    expect(alerts.getAllByRole('button').map((b) => b.textContent)).toEqual(['4 raised', 'Rafaela asked', '3 low engagement']);
    // The stage column is the main landmark; the header, alerts, stage and bar sit inside it.
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-surface', 'stage');
    expect(within(main).getByRole('region', { name: 'Presentation' })).toBeInTheDocument();
    expect(within(main).getByRole('list', { name: 'Webcams' })).toHaveClass('flex-col');
    expect(within(main).getByRole('navigation', { name: 'Actions' })).toBeInTheDocument();
    expect(within(main).getByRole('group', { name: 'Alerts' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    // The help and "Breakouts ended" pills are status only until milestone 5; these three open something.
    for (const b of alerts.getAllByRole('button')) expect(b).toHaveAccessibleDescription(/^Opens/);
    expect(screen.getByRole('button', { name: 'People' })).toHaveAccessibleDescription('4 raised hands');
    expect(screen.getByRole('button', { name: 'Chat' })).toHaveAccessibleDescription('2 unread');
  });

  it('G1: People open with the hands first; the strip moves above the slide', () => {
    renderAt(G1);
    expect(screen.getByRole('complementary', { name: 'People' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'People 4 raised hands' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('list', { name: 'Raised hands 4' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Everyone 10' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Webcams' })).toHaveClass('flex-row');
    expect(screen.getByRole('button', { name: 'People' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('G2–G5: the chat scopes and threads', () => {
    const { unmount } = renderAt(G2);
    expect(screen.getByRole('tab', { name: 'Everyone' })).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByRole('list', { name: 'Messages to everyone' })).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('textbox', { name: 'Message everyone' })).toBeInTheDocument();
    // Opening Everyone reads Rafaela's question: the pill and the public unread are gone, her DM stays.
    expect(screen.queryByRole('button', { name: 'Rafaela asked' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Direct 1 unread' })).toBeInTheDocument();
    unmount();

    renderAt(G3);
    expect(screen.getByRole('tab', { name: 'Direct 1 unread' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /^Rafaela Monaco/ })).toBeInTheDocument();
    screen.getByRole('complementary').remove();

    renderAt(G4);
    expect(screen.getByRole('heading', { level: 3, name: 'Rafaela Monaco' })).toBeInTheDocument();
    expect(screen.getByText('Only you and Rafaela can see this conversation. Moderators can’t read it.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message Rafaela privately' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to direct messages' })).toBeInTheDocument();
    // A deep link to a thread focuses nothing: only "Message privately" does.
    expect(screen.getByRole('textbox', { name: 'Message Rafaela privately' })).not.toHaveFocus();
    screen.getByRole('complementary').remove();

    renderAt(G5);
    expect(screen.getByRole('heading', { level: 3, name: 'Frederick Dixon' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Messages with Frederick Dixon' })).queryAllByRole('listitem')).toHaveLength(1);
  });

  it('L1: People filtered to low engagement from the insight pill', () => {
    renderAt(L1);
    expect(screen.getByRole('radio', { name: 'Low engagement 3 people' })).toBeChecked();
    expect(screen.getByRole('list', { name: 'Low engagement 3' })).toBeInTheDocument();
    expect(screen.getByText(/Quiet for 15\+ minutes/)).toBeInTheDocument();
  });

  it('toggles the panel from the action bar, and closing it from the panel returns focus to its toggle', async () => {
    const user = userEvent.setup();
    renderAt(F1);
    await user.click(screen.getByRole('button', { name: 'People' }));
    expect(screen.getByRole('complementary', { name: 'People' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Chat' }));
    expect(screen.getByRole('complementary', { name: 'Chat' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Chat' }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '4 raised' }));
    expect(screen.getByRole('complementary', { name: 'People' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'People' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Chat' }));
    await user.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(screen.getByRole('button', { name: 'Chat' })).toHaveFocus();
  });

  it('raising a hand shows up in People; a student’s hand is announced, your own is not; Alt + H lowers it', async () => {
    const user = userEvent.setup();
    renderAt(G1);
    await user.click(screen.getByRole('button', { name: 'Raise hand' }));
    expect(screen.getByRole('button', { name: 'Raise hand' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('list', { name: 'Raised hands 5' })).toBeInTheDocument();
    // You pressed the toggle and it reports its state: no announcement, and the pill counts the students only.
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: '4 raised' })).toBeInTheDocument();
    dispatch({ type: 'raiseHand', participantId: 'anton' });
    expect(screen.getByRole('list', { name: 'Raised hands 6' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Anton raised their hand');
    expect(screen.getByRole('button', { name: '5 raised' })).toBeInTheDocument();
    await user.keyboard('{Alt>}h{/Alt}');
    expect(screen.getByRole('button', { name: 'Raise hand' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('list', { name: 'Raised hands 5' })).toBeInTheDocument();
  });

  it('sending a message adds it to chat; "Message privately" focuses the thread composer and "Back" the row', async () => {
    const user = userEvent.setup();
    renderAt(G2);
    await user.click(screen.getByRole('textbox', { name: 'Message everyone' }));
    await user.keyboard('Welcome, everyone{Enter}');
    const list = screen.getByRole('list', { name: 'Messages to everyone' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(within(list).getAllByRole('listitem').at(-1)).toHaveTextContent('Welcome, everyone');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.click(screen.getByRole('tab', { name: 'People 4 raised hands' }));
    await user.click(screen.getByRole('button', { name: 'Message Bruno privately' }));
    expect(screen.getByRole('complementary', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Bruno' })).toBeInTheDocument();
    const composer = screen.getByRole('textbox', { name: 'Message Bruno privately' });
    expect(composer).toHaveFocus();
    await user.keyboard('Yes, here it is{Enter}');
    expect(within(screen.getByRole('list', { name: 'Messages with Bruno' })).getAllByRole('listitem')).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: 'Back to direct messages' }));
    const row = screen.getByRole('button', { name: /^Bruno You: Yes, here it is/ });
    expect(row).toBeInTheDocument();
    expect(row).toHaveFocus();
  });

  it('the student menu acts on the store, and Alt + M and Alt + V toggle your own media', async () => {
    const user = userEvent.setup();
    renderAt(G1);
    await user.click(screen.getByRole('button', { name: 'More actions for Anton Georgiev' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Make presenter' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(screen.getByText('Presenting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Microphone' })).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{Alt>}m{/Alt}');
    expect(screen.getByRole('button', { name: 'Microphone' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Camera' })).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{Alt>}v{/Alt}');
    expect(screen.getByRole('button', { name: 'Camera' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('removing a person announces it and moves focus to the next row’s ⋯ button', async () => {
    const user = userEvent.setup();
    renderAt(G1);
    await user.click(screen.getByRole('button', { name: 'More actions for Anton Georgiev' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from session' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(screen.queryByText('Anton Georgiev')).not.toBeInTheDocument();
    expect(screen.getByText(/13 people/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Anton removed');
    await waitFor(() => expect(screen.getByRole('button', { name: 'More actions for Michelle Winkler' })).toHaveFocus());
  });

  it('Leave confirms, then returns to the index with focus on its heading', async () => {
    const user = userEvent.setup();
    renderAt(F1);
    await user.click(screen.getByRole('button', { name: 'Leave session' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Leave the session?' });
    await user.click(within(dialog).getByRole('button', { name: 'Leave session' }));
    const heading = await screen.findByRole('heading', { level: 1, name: 'BigBlueButton 4.0 prototype' });
    await waitFor(() => expect(heading).toHaveFocus());
  });
});
