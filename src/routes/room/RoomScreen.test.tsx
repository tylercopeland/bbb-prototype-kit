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
const M1 = '/desktop/M1ShareScreen-k5tp';
const M2 = '/desktop/M2ShareDeck-581i';
const N1 = '/desktop/N1Overview-xpbk';
const H1 = '/desktop/H1MediaSlides-2x0x';
const H2 = '/desktop/H2MediaScreen-ez5s';
const O1 = '/desktop/O1Analytics';
const O2 = '/desktop/O2StudentActions';
const BO1 = '/desktop/BO1Entry-desk';
const PL1 = '/desktop/PL1Setup';
const PL2 = '/desktop/PL2Live';
const PL3 = '/desktop/PL3Shown';
const TM1 = '/desktop/TM1Ready';
const TM2 = '/desktop/TM2Running';
const TM3 = '/desktop/TM3Min';
const TM4 = '/desktop/TM4Done';

describe('RoomScreen', () => {
  it('F1: the header, alerts, stage and action bar from the store, with no panel', () => {
    renderAt(F1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hack Week: Brazil 2026');
    expect(screen.getByText(/14 people/)).toBeInTheDocument();
    const alerts = within(screen.getByRole('group', { name: 'Alerts' }));
    expect(alerts.getAllByRole('button').map((b) => b.textContent)).toEqual([
      '4 raised',
      'Rafaela asked',
      '3 low engagement',
    ]);
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
    expect(screen.getByRole('tab', { name: 'People 4 raised hands' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('list', { name: 'Raised hands 4' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Everyone 10' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Webcams' })).toHaveClass('flex-row');
    expect(screen.getByRole('button', { name: 'People' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('G2–G5: the chat scopes and threads', () => {
    const { unmount } = renderAt(G2);
    expect(screen.getByRole('tab', { name: 'Everyone' })).toHaveAttribute('aria-selected', 'true');
    expect(
      within(screen.getByRole('list', { name: 'Messages to everyone' })).getAllByRole('listitem'),
    ).toHaveLength(3);
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
    expect(
      screen.getByText('Only you and Rafaela can see this conversation. Moderators can’t read it.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message Rafaela privately' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to direct messages' })).toBeInTheDocument();
    // A deep link to a thread focuses nothing: only "Message privately" does.
    expect(screen.getByRole('textbox', { name: 'Message Rafaela privately' })).not.toHaveFocus();
    screen.getByRole('complementary').remove();

    renderAt(G5);
    expect(screen.getByRole('heading', { level: 3, name: 'Frederick Dixon' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Messages with Frederick Dixon' })).queryAllByRole('listitem'),
    ).toHaveLength(1);
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
    expect(
      within(screen.getByRole('list', { name: 'Messages with Bruno' })).getAllByRole('listitem'),
    ).toHaveLength(4);
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

  it('leaves Alt + letter alone inside an editable field', async () => {
    const user = userEvent.setup();
    renderAt(G2);
    await user.click(screen.getByRole('textbox', { name: 'Message everyone' }));
    await user.keyboard('{Alt>}h{/Alt}');
    expect(screen.getByRole('button', { name: 'Raise hand' })).toHaveAttribute('aria-pressed', 'false');
    await user.keyboard('{Alt>}m{/Alt}');
    expect(screen.getByRole('button', { name: 'Microphone' })).toHaveAttribute('aria-pressed', 'true');
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
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'More actions for Michelle Winkler' })).toHaveFocus(),
    );
  });

  it('M1 and M2: the share tabs, the live pill and Stop sharing', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt(M1);
    expect(screen.getByRole('tab', { name: 'Entire screen' })).toHaveAttribute('aria-selected', 'true');
    const pill = screen.getByRole('group', { name: 'Screen share' });
    expect(pill).toHaveTextContent('Everyone sees your entire screen');
    expect(screen.getByText('Your entire screen')).toBeInTheDocument();
    // The screen is on stage, so there are no slide controls to draw over it.
    expect(screen.queryByRole('group', { name: 'Presentation controls' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share media' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('tab', { name: 'Presentation 3 / 12' }));
    expect(pill).toHaveTextContent('Everyone sees your slides · your screen is still shared');
    expect(screen.getByRole('heading', { level: 2, name: 'BigBlueButton 4.0, refined' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stop sharing' }));
    expect(screen.queryByRole('group', { name: 'Screen share' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'What everyone sees' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share media' })).toHaveAttribute('aria-pressed', 'false');
    unmount();

    renderAt(M2);
    expect(screen.getByRole('tab', { name: 'Presentation 3 / 12' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('group', { name: 'Screen share' })).toHaveTextContent(
      'your screen is still shared',
    );
    expect(screen.getByRole('group', { name: 'Presentation controls' })).toBeInTheDocument();
  });

  it('F1: the presentation controls page the deck and pick the tool and ink from the store', async () => {
    const user = userEvent.setup();
    renderAt(F1);
    const controls = screen.getByRole('group', { name: 'Presentation controls' });
    expect(within(controls).getByText('Slide').parentElement).toHaveTextContent('Slide 3 / 12');
    await user.click(within(controls).getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('heading', { level: 2, name: 'What we heard' })).toBeInTheDocument();
    await user.click(within(controls).getByRole('button', { name: 'Previous slide' }));
    expect(screen.getByRole('heading', { level: 2, name: 'BigBlueButton 4.0, refined' })).toBeInTheDocument();
    expect(within(controls).getByRole('radio', { name: 'Pen' })).toBeChecked();
    expect(within(controls).getByRole('radio', { name: 'Amber' })).toBeChecked();
    await user.click(within(controls).getByRole('radio', { name: 'Eraser' }));
    await user.click(within(controls).getByRole('radio', { name: 'Blue' }));
    expect(within(controls).getByRole('radio', { name: 'Eraser' })).toBeChecked();
    expect(within(controls).getByRole('radio', { name: 'Blue' })).toBeChecked();
  });

  it('N1: All slides is open; picking a slide moves the deck, closes it and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    renderAt(N1);
    const dialog = await screen.findByRole('dialog', { name: 'All slides' });
    expect(within(dialog).getByText('bbb-4-refined.pdf · 12 slides')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Go to slide 3: BigBlueButton 4.0, refined' }),
    ).toHaveAttribute('aria-current', 'true');
    await user.click(within(dialog).getByRole('button', { name: 'Go to slide 9: Scalable UI' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 2, name: 'Scalable UI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All slides' })).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(screen.getByRole('button', { name: 'All slides' })).toHaveFocus());
  });

  it('H1 and H2: the Share media picker is open on its type; a screen kind starts the share and closes it', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt(H1);
    const picker = await screen.findByRole('dialog', { name: 'Share media' });
    expect(screen.getByRole('button', { name: 'Share media', hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(within(picker).getByRole('tab', { name: 'Slides' })).toHaveAttribute('aria-selected', 'true');
    expect(within(picker).getByRole('radio', { name: 'Present bbb-4-refined.pdf' })).toBeChecked();
    await user.click(within(picker).getByRole('radio', { name: 'Present hack-week-kickoff.pdf' }));
    // The stage behind the modal picker is hidden from assistive technology while it is open.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Hack Week kickoff', hidden: true }),
    ).toBeInTheDocument();
    await user.click(within(picker).getByRole('tab', { name: 'Screen' }));
    expect(within(picker).getByRole('button', { name: 'A window' })).toBeInTheDocument();
    await user.click(within(picker).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Share media' })).toHaveFocus());
    unmount();

    renderAt(H2);
    const screenPicker = await screen.findByRole('dialog', { name: 'Share media' });
    expect(within(screenPicker).getByRole('tab', { name: 'Screen' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(within(screenPicker).getByRole('button', { name: 'A browser tab' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('tab', { name: 'A browser tab' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('group', { name: 'Screen share' })).toHaveTextContent(
      'Everyone sees your a browser tab',
    );
  });

  it('the picker’s other types close it and say what the prototype leaves out, or hand over to Poll and Plugins', async () => {
    const user = userEvent.setup();
    renderAt(H1);
    const picker = await screen.findByRole('dialog', { name: 'Share media' });
    await user.click(within(picker).getByRole('tab', { name: 'Audio' }));
    await user.click(within(picker).getByRole('button', { name: 'Start sharing' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Share media' })).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByText('Sharing computer audio isn’t part of this prototype yet'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Share media' }));
    const again = await screen.findByRole('dialog', { name: 'Share media' });
    await user.click(within(again).getByRole('tab', { name: 'More' }));
    await user.click(within(again).getByRole('button', { name: 'From a plugin…' }));
    expect(await screen.findByRole('dialog', { name: 'Plugins' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Share media' })).not.toBeInTheDocument();
  });

  it('BO1: the Plugins picker is open; Breakout rooms opens the breakout surface, Poll opens its panel', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt(BO1);
    const plugins = await screen.findByRole('dialog', { name: 'Plugins' });
    expect(screen.getByRole('button', { name: 'Plugins', hidden: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(plugins).getByRole('button', { name: 'Breakout rooms' })).toHaveAccessibleDescription(
      '4 rooms set up',
    );
    expect(within(plugins).getByRole('button', { name: 'Q&A board' })).toBeInTheDocument();
    await user.click(within(plugins).getByRole('button', { name: 'Breakout rooms' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 2, name: 'Breakout rooms' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plugins' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Back to the room' }));
    expect(screen.getByRole('region', { name: 'Presentation' })).toBeInTheDocument();
    unmount();

    renderAt(BO1);
    const again = await screen.findByRole('dialog', { name: 'Plugins' });
    await user.click(within(again).getByRole('button', { name: 'Poll' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('complementary', { name: 'Poll' })).toBeInTheDocument();
  });

  it('O1: the Learning Analytics tooltip is pinned open, and the button says it opens in a new tab', async () => {
    renderAt(O1);
    const button = screen.getByRole('button', { name: 'Learning Analytics Dashboard' });
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Learning Analytics Dashboard');
    expect(tooltip).toHaveAccessibleName('Opens in a new tab');
    expect(button).toHaveAccessibleDescription('Opens in a new tab');
  });

  it('O2: Anton’s menu is open on load, and its switches toggle without closing it', async () => {
    const user = userEvent.setup();
    renderAt(O2);
    const menu = await screen.findByRole('menu', { name: 'More actions for Anton Georgiev' });
    const whiteboard = within(menu).getByRole('menuitemcheckbox', { name: 'Whiteboard access' });
    expect(whiteboard).toHaveAttribute('aria-checked', 'false');
    await user.click(whiteboard);
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Whiteboard access' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Whiteboard')).toBeInTheDocument();
  });

  it('React sends a reaction to the store, shows it on your tile and closes the tray', async () => {
    const user = userEvent.setup();
    renderAt(F1);
    await user.click(screen.getByRole('button', { name: 'React' }));
    const tray = await screen.findByRole('dialog', { name: 'React' });
    await user.click(within(tray).getByRole('button', { name: 'Clap' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // Your reaction is in the store (your own tile is not among the five the strip shows for this class).
    expect(window.bbbRoom?.getState().reactions.items).toMatchObject([{ from: 'helena', kind: 'clap' }]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'React' })).toHaveFocus());
    // Your own reaction is not announced; another person's shows on their tile and is announced.
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    dispatch({ type: 'sendReaction', from: 'frederick', kind: 'love' });
    expect(screen.getByRole('img', { name: 'Reacted: Love' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Frederick reacted: Love');
  });

  it('Room settings: Private chat off keeps the teacher’s Message buttons and changes the thread note', async () => {
    const user = userEvent.setup();
    renderAt(G1);
    expect(screen.getByRole('button', { name: 'Message Bruno privately' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Room settings' }));
    const settings = await screen.findByRole('dialog', { name: 'Room settings' });
    const sw = within(settings).getByRole('switch', { name: 'Private chat' });
    expect(sw).toBeChecked();
    await user.click(sw);
    expect(sw).not.toBeChecked();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // The teacher is a moderator: teacher-to-student messages keep working.
    const message = screen.getByRole('button', { name: 'Message Bruno privately' });
    expect(message).toBeInTheDocument();
    await user.click(message);
    expect(
      screen.getByText(/Private chat is off for students\. Only you and Bruno can see this conversation/),
    ).toBeInTheDocument();
    await user.keyboard('A note just for you{Enter}');
    expect(
      within(screen.getByRole('list', { name: 'Messages with Bruno' })).getAllByRole('listitem'),
    ).toHaveLength(4);
  });

  it('PL1: the poll builder in the panel; Ask the class starts the poll and focuses Show results', async () => {
    const user = userEvent.setup();
    renderAt(PL1);
    const panel = screen.getByRole('complementary', { name: 'Poll' });
    expect(within(panel).getByRole('textbox', { name: 'Question' })).toHaveValue(
      'Which change makes it easiest to see who is muted?',
    );
    expect(within(panel).getByRole('radio', { name: 'Multiple choice' })).toBeChecked();
    await user.click(within(panel).getByRole('button', { name: 'Add an answer' }));
    await user.type(within(panel).getByRole('textbox', { name: 'Answer E' }), 'Something else');
    expect(window.bbbRoom?.getState().poll.options).toHaveLength(5);
    await user.click(within(panel).getByRole('radio', { name: 'Yes / No' }));
    expect(within(panel).queryByRole('textbox', { name: /Answer/ })).not.toBeInTheDocument();
    expect(within(panel).getByText('Yes')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'Ask the class' }));
    expect(window.bbbRoom?.getState().poll).toMatchObject({ phase: 'live', type: 'yesno', votes: [0, 0] });
    const show = within(panel).getByRole('button', { name: 'Show results to everyone' });
    await waitFor(() => expect(show).toHaveFocus());
    expect(within(panel).getByText('Live · 0 of 13 answered')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Poll results shown/ })).not.toBeInTheDocument();
  });

  it('PL2: answers coming in are counted and announced politely; End poll closes it and New poll returns to the builder', async () => {
    const user = userEvent.setup();
    renderAt(PL2);
    const panel = screen.getByRole('complementary', { name: 'Poll' });
    expect(within(panel).getByText('Live · 9 of 13 answered')).toBeInTheDocument();
    expect(within(panel).getByText(/Only you see the results until you show them/)).toBeInTheDocument();
    dispatch({ type: 'answerPoll', option: 2 });
    expect(within(panel).getByText('Live · 10 of 13 answered')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Poll: 10 of 13 answered');
    await user.click(within(panel).getByRole('button', { name: 'End poll' }));
    expect(within(panel).getByText('Poll closed · 10 of 13 answered')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'New poll' }));
    const question = within(panel).getByRole('textbox', { name: 'Question' });
    await waitFor(() => expect(question).toHaveFocus());
    expect(window.bbbRoom?.getState().poll.votes).toEqual([0, 0, 0, 0]);
  });

  it('PL3: the results are on the stage for everyone; Hide removes the card and lands on Show results; Close hands focus to Plugins', async () => {
    const user = userEvent.setup();
    renderAt(PL3);
    const card = screen.getByRole('region', { name: 'Poll results shown to everyone' });
    expect(within(card).getByText('9 of 13 answered · shown to everyone')).toBeInTheDocument();
    // The card sits in the reserved top-right corner of the slide (D1).
    expect(card.parentElement).toHaveClass('items-end', 'justify-start');
    const panel = screen.getByRole('complementary', { name: 'Poll' });
    expect(within(panel).getByText(/Results are shown to everyone on the stage/)).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Hide results from everyone' }));
    expect(screen.queryByRole('region', { name: 'Poll results shown to everyone' })).not.toBeInTheDocument();
    const show = within(panel).getByRole('button', { name: 'Show results to everyone' });
    await waitFor(() => expect(show).toHaveFocus());
    await user.click(show);
    expect(screen.getByRole('region', { name: 'Poll results shown to everyone' })).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'End poll' }));
    await user.click(within(panel).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Poll results/ })).not.toBeInTheDocument();
    expect(window.bbbRoom?.getState().poll.phase).toBe('off');
    expect(screen.getByRole('button', { name: 'Plugins' })).toHaveFocus();
  });

  it('TM1 and TM2: the timer card from the store; the quick times, Start, Pause and +1 min change it; Remove hands focus to Plugins', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt(TM1);
    const card = screen.getByRole('group', { name: 'Timer' });
    expect(within(card).getByText('5:00')).toBeInTheDocument();
    expect(within(card).getByText('Ready')).toBeInTheDocument();
    expect(within(card).getByRole('radio', { name: '5 min' })).toBeChecked();
    // Default corner: the reserved top right (D1).
    expect(card.parentElement).toHaveClass('items-end', 'justify-start');
    await user.click(within(card).getByRole('radio', { name: '3 min' }));
    expect(within(card).getByText('3:00')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Start' }));
    expect(window.bbbRoom?.getState().timer.phase).toBe('running');
    expect(within(card).getByText('Running')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: '+1 min' }));
    expect(within(card).getByText('4:00')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Pause' }));
    expect(within(card).getByText('Paused')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Remove timer' }));
    expect(screen.queryByRole('group', { name: 'Timer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plugins' })).toHaveFocus();
    unmount();

    renderAt(TM2);
    expect(within(screen.getByRole('group', { name: 'Timer' })).getByText('3:42')).toBeInTheDocument();
    // The ticking time is plain text; a tick announces nothing (X10).
    dispatch({ type: 'tick', now: window.bbbRoom!.getState().clock.now + 1000 });
    expect(within(screen.getByRole('group', { name: 'Timer' })).getByText('3:41')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('TM2: Move to corner moves the card and announces it politely', async () => {
    const user = userEvent.setup();
    renderAt(TM2);
    const card = screen.getByRole('group', { name: 'Timer' });
    await user.click(within(card).getByRole('button', { name: 'Move to corner' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Bottom left' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(window.bbbRoom?.getState().timer.corner).toBe('bottomLeft');
    expect(screen.getByRole('group', { name: 'Timer' }).parentElement).toHaveClass(
      'items-start',
      'justify-end',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Timer moved to bottom left');
    // The card remounted in its new corner: its Move to corner button holds focus (WCAG 2.4.3).
    await waitFor(() => expect(screen.getByRole('button', { name: 'Move to corner' })).toHaveFocus());
  });

  it('TM3 and TM4: the pill restores to the card; time’s up is announced assertively when the clock reaches the end', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt(TM3);
    const pill = screen.getByRole('button', { name: 'Expand timer, 3:42 left' });
    await user.click(pill);
    expect(screen.getByRole('group', { name: 'Timer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minimize timer' })).toHaveFocus();
    unmount();

    const done = renderAt(TM4);
    const card = screen.getByRole('group', { name: 'Timer' });
    expect(within(card).getByText('0:00')).toBeInTheDocument();
    expect(within(card).getByText('Time’s up!')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Restart' })).toBeInTheDocument();
    done.unmount();

    renderAt(TM2);
    const state = window.bbbRoom!.getState();
    dispatch({ type: 'tick', now: state.timer.endsAt! });
    expect(within(screen.getByRole('group', { name: 'Timer' })).getByText('Time’s up!')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Time’s up');
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
