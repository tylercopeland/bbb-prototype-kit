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

const MB1 = '/mobile/MB1Room';
const MB2 = '/mobile/MB2Updates';
const MB3 = '/mobile/MB3People';
const MB4 = '/mobile/MB4Student';
const MB5 = '/mobile/MB5Chat';
const MB6 = '/mobile/MB6React';
const MB7 = '/mobile/MB7More';
const MB8 = '/mobile/MB8Landscape';
const MB9 = '/mobile/MB9LandscapePeople';
const MB10 = '/mobile/MB10Everyone';
const MB11 = '/mobile/MB11Slides';
const MB12 = '/mobile/MB12Annotate';
const MB14 = '/mobile/MB14LandMin';
const MB15 = '/mobile/MB15Attendee';
const MB16 = '/mobile/MB16Confirm';
const MB17 = '/mobile/MB17KeyboardChat';

// A modal sheet marks the rest of the page aria-hidden, so the bar is queried with `hidden` while one is open.
const nav = () => within(screen.getByRole('navigation', { name: 'Actions', hidden: true }));
const navButton = (name: string) => nav().getByRole('button', { name, hidden: true });
/** A dialog under a stacked one is aria-hidden as well. */
const hiddenDialog = (name: string) => screen.getByRole('dialog', { name, hidden: true });

describe('MobileRoomScreen', () => {
  it('MB1: the stacked header, the updates pill, the slide with its pager, four webcams and the bar', () => {
    renderAt(MB1);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-surface', 'stage');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hack Week: Brazil 2026');
    expect(screen.getByText(/14 people/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3 updates' })).toHaveAccessibleDescription(
      'Opens the updates sheet',
    );
    // The slide, then the pager under it (P1, P3), always visible on touch.
    const presentation = within(screen.getByRole('region', { name: 'Presentation' }));
    expect(presentation.getByRole('heading', { level: 2 })).toHaveTextContent('BigBlueButton 4.0, refined');
    expect(presentation.getByRole('button', { name: 'Minimize presentation' })).toBeInTheDocument();
    const pager = within(screen.getByRole('group', { name: 'Slides' }));
    expect(pager.getByRole('button', { name: 'All slides' })).toHaveAttribute('aria-expanded', 'false');
    expect(pager.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
    expect(pager.getByText(/3 \/ 12/)).toBeInTheDocument();
    expect(pager.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
    expect(pager.getByRole('button', { name: 'Annotate' })).toHaveAttribute('aria-pressed', 'false');
    // Four tiles, the speaker first, then "+10 · See all" (X15: both counts from the data).
    const webcams = within(screen.getByRole('list', { name: 'Webcams' }));
    expect(webcams.getAllByRole('listitem')).toHaveLength(4);
    expect(webcams.getAllByRole('figure')[0]).toHaveAccessibleName(/^Frederick/);
    expect(screen.getByText('Speaker and raised hands first')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+10 more, see all 14 people' })).toBeInTheDocument();
    // The bar: People & chat with the unread count, the media group, Leave.
    expect(navButton('People and chat')).toHaveAccessibleDescription('2 unread');
    expect(navButton('Microphone')).toHaveAttribute('aria-pressed', 'true');
    expect(navButton('Camera')).toHaveAttribute('aria-pressed', 'true');
    expect(navButton('React')).toHaveAttribute('aria-expanded', 'false');
    expect(navButton('More')).toHaveAttribute('aria-expanded', 'false');
    expect(navButton('Leave session')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('MB1 → MB13: the pager turns the slides and Minimize swaps the slide for everyone plus the presentation tile', async () => {
    const user = userEvent.setup();
    renderAt(MB1);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(within(screen.getByRole('group', { name: 'Slides' })).getByText(/4 \/ 12/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Minimize presentation' }));
    expect(screen.queryByRole('region', { name: 'Presentation' })).not.toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Webcams and minimized presentation' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(15);
    expect(list).toHaveClass('grid-cols-3');
    expect(screen.queryByRole('button', { name: /See all/ })).not.toBeInTheDocument();
    // The tile is the way back: the whole cell, named by its plate (WCAG 2.5.3).
    const restore = within(list).getByRole('button', { name: 'Presentation · 4 / 12, restore' });
    expect(within(list).getAllByRole('listitem')[0]).toContainElement(restore);
    await user.click(restore);
    expect(screen.getByRole('region', { name: 'Presentation' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Webcams' })).toHaveClass('grid-cols-2');
  });

  it('MB11: the All slides sheet lists the deck three to a row with the current slide marked; a pick moves the deck, closes and returns focus', async () => {
    const user = userEvent.setup();
    renderAt(MB11);
    const sheet = within(await screen.findByRole('dialog', { name: 'All slides' }));
    expect(sheet.getByLabelText('Slide 3 of 12')).toHaveTextContent('3 / 12');
    const slides = sheet.getByRole('list', { name: 'Slides' });
    expect(slides).toHaveClass('grid-cols-3');
    expect(within(slides).getAllByRole('listitem')).toHaveLength(12);
    expect(
      within(slides).getByRole('button', { name: 'Go to slide 3: BigBlueButton 4.0, refined' }),
    ).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'All slides', hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await user.click(within(slides).getByRole('button', { name: 'Go to slide 9: Scalable UI' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Slides' })).getByText(/9 \/ 12/)).toBeInTheDocument();
    const allSlides = screen.getByRole('button', { name: 'All slides' });
    expect(allSlides).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(allSlides).toHaveFocus());
    // Opened by a tap, closed by Escape: back on the button.
    await user.click(allSlides);
    await screen.findByRole('dialog', { name: 'All slides' });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(allSlides).toHaveFocus());
  });

  it('MB12: Annotate swaps the pager for the whiteboard toolbar; the toggle and Escape end it with focus kept', async () => {
    const user = userEvent.setup();
    renderAt(MB12);
    const row = within(screen.getByRole('group', { name: 'Slides' }));
    const annotate = row.getByRole('button', { name: 'Annotate' });
    expect(annotate).toHaveAttribute('aria-pressed', 'true');
    expect(row.getByRole('group', { name: 'Whiteboard tools' })).toBeInTheDocument();
    expect(row.getByRole('radio', { name: 'Pen' })).toBeChecked();
    expect(row.getByRole('radio', { name: 'Blue' })).toHaveClass('size-control-touch');
    expect(row.queryByRole('button', { name: 'All slides' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Minimize presentation' })).not.toBeInTheDocument();
    // The ink changes through the store, as on desktop.
    await user.click(row.getByRole('radio', { name: 'Red' }));
    expect(row.getByRole('radio', { name: 'Red' })).toBeChecked();
    // Escape from the toolbar ends annotating and lands on the toggle, which stays in place.
    await user.keyboard('{Escape}');
    expect(row.queryByRole('group', { name: 'Whiteboard tools' })).not.toBeInTheDocument();
    expect(row.getByRole('button', { name: 'All slides' })).toBeInTheDocument();
    expect(annotate).toHaveAttribute('aria-pressed', 'false');
    expect(annotate).toHaveFocus();
    // The toggle starts and ends it, keeping focus and its label (X7).
    await user.click(annotate);
    expect(annotate).toHaveAttribute('aria-pressed', 'true');
    expect(row.getByRole('group', { name: 'Whiteboard tools' })).toBeInTheDocument();
    await user.click(annotate);
    expect(annotate).toHaveAttribute('aria-pressed', 'false');
    expect(annotate).toHaveFocus();
    expect(annotate).toHaveTextContent('');
    expect(annotate).toHaveAccessibleName('Annotate');
  });

  it('MB12: Escape leaves a sheet over the stage to the sheet, and annotating stays on', async () => {
    const user = userEvent.setup();
    renderAt(`${MB12}&sheet=more`.replace('&', '?'));
    await screen.findByRole('dialog', { name: 'More' });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annotate' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('MB14: landscape with the presentation minimized goes to one column, five tiles a row, the bar centred', () => {
    renderAt(MB14);
    expect(screen.getByRole('main')).toHaveClass('flex-col');
    const list = screen.getByRole('list', { name: 'Webcams and minimized presentation' });
    expect(list).toHaveClass('grid-cols-5');
    expect(within(list).getAllByRole('listitem')).toHaveLength(15);
    expect(within(list).getByRole('button', { name: 'Presentation · 3 / 12, restore' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Actions' })).toHaveClass('w-panel');
  });

  it('MB17: the chat sheet with the keyboard up: the composer holds focus and the overlay is padded by the keyboard', async () => {
    const user = userEvent.setup();
    renderAt(MB17);
    const sheet = await screen.findByRole('dialog', { name: 'People and chat' });
    expect(within(sheet).getByRole('tab', { name: 'Chat' })).toHaveAttribute('aria-selected', 'true');
    const composer = within(sheet).getByRole('textbox', { name: 'Message everyone' });
    await waitFor(() => expect(composer).toHaveFocus());
    expect(document.documentElement.style.getPropertyValue('--bbb-keyboard-inset')).toBe('336px');
    expect(sheet.closest('.pb-keyboard')).not.toBeNull();
    // Enter sends to everyone, as on desktop.
    await user.keyboard('Hello from the phone{Enter}');
    const messages = within(sheet).getByRole('list', { name: 'Messages to everyone' });
    expect(within(messages).getAllByRole('listitem')).toHaveLength(4);
    expect(within(messages).getByText('Hello from the phone')).toBeInTheDocument();
    expect(composer).toHaveValue('');
  });

  it('MB5: with the keyboard down the chat sheet pads nothing and the composer waits for a tap', async () => {
    renderAt(MB5);
    await screen.findByRole('dialog', { name: 'People and chat' });
    expect(document.documentElement.style.getPropertyValue('--bbb-keyboard-inset')).toBe('0px');
    expect(screen.getByRole('textbox', { name: 'Message everyone' })).not.toHaveFocus();
  });

  it('MB2: the Updates sheet lists each alert with what it opens; the hands row opens People filtered to raised hands', async () => {
    const user = userEvent.setup();
    renderAt(MB2);
    const sheet = within(await screen.findByRole('dialog', { name: 'Updates' }));
    expect(sheet.getByRole('button', { name: '4 hands raised' })).toHaveAccessibleDescription(
      'Bruno has waited 3 min',
    );
    expect(sheet.getByRole('button', { name: 'Rafaela asked a question' })).toHaveAccessibleDescription(
      /Will the new layout/,
    );
    expect(sheet.getByRole('button', { name: '3 students with low engagement' })).toHaveAccessibleDescription(
      'Quiet for 15+ minutes in this session',
    );
    expect(sheet.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    await user.click(sheet.getByRole('button', { name: '4 hands raised' }));
    const people = within(await screen.findByRole('dialog', { name: 'People and chat' }));
    expect(screen.queryByRole('dialog', { name: 'Updates' })).not.toBeInTheDocument();
    expect(people.getByRole('radio', { name: 'Raised hands 4 people' })).toBeChecked();
    expect(people.getByRole('list', { name: 'Raised hands 4' })).toBeInTheDocument();
  });

  it('MB3: the People & chat sheet with the tabs in its header; the close button returns focus to the bar', async () => {
    const user = userEvent.setup();
    renderAt(MB3);
    const sheet = within(await screen.findByRole('dialog', { name: 'People and chat' }));
    expect(sheet.getByRole('tab', { name: 'People 4 raised hands' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(sheet.getByRole('tab', { name: 'Chat 2 unread' })).toBeInTheDocument();
    expect(sheet.getByRole('list', { name: 'Raised hands 4' })).toBeInTheDocument();
    expect(sheet.getByRole('list', { name: 'Everyone 10' })).toBeInTheDocument();
    // Rows keep Message privately and a ⋯ that opens the student sheet, not a menu.
    const more = sheet.getByRole('button', { name: 'More actions for Anton Georgiev' });
    expect(more).toHaveAttribute('aria-haspopup', 'dialog');
    expect(sheet.getByRole('button', { name: 'Message Anton Georgiev privately' })).toBeInTheDocument();
    expect(navButton('People and chat')).toHaveAttribute('aria-pressed', 'true');
    await user.click(sheet.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Opened from the URL, there was no press to return to: the bar button takes focus.
    await waitFor(() => expect(navButton('People and chat')).toHaveFocus());
  });

  it('MB4: the student sheet stacks over People with switches, Message, Make presenter and Remove behind a confirmation', async () => {
    const user = userEvent.setup();
    renderAt(MB4);
    const student = within(await screen.findByRole('dialog', { name: 'Anton Georgiev' }));
    expect(hiddenDialog('People and chat')).toBeInTheDocument();
    expect(student.getByText('Muted, camera on')).toBeInTheDocument();
    expect(student.getByRole('switch', { name: 'Microphone' })).not.toBeChecked();
    expect(student.getByRole('switch', { name: 'Microphone' })).toHaveAccessibleDescription(
      'Turning on asks them to unmute',
    );
    expect(student.getByRole('switch', { name: 'Camera' })).toBeChecked();
    expect(student.getByRole('switch', { name: 'Whiteboard access' })).not.toBeChecked();
    expect(student.getByRole('switch', { name: 'Moderator' })).not.toBeChecked();
    expect(student.getByRole('switch', { name: 'Lock public chat' })).not.toBeChecked();
    expect(student.getByRole('button', { name: 'Message' })).toBeInTheDocument();
    expect(student.getByRole('button', { name: 'Make presenter' })).toBeEnabled();
    // Switches change the store (X9: state is announced as checked), and the Microphone asks to unmute.
    await user.click(student.getByRole('switch', { name: 'Moderator' }));
    expect(student.getByRole('switch', { name: 'Moderator' })).toBeChecked();
    expect(student.getByText('Muted, camera on · Moderator')).toBeInTheDocument();
    await user.click(student.getByRole('switch', { name: 'Microphone' }));
    expect(student.getByRole('switch', { name: 'Microphone' })).toHaveAccessibleDescription(
      /Unmute requested/,
    );
    // Remove asks first; Cancel takes focus so Enter never removes by accident.
    await user.click(student.getByRole('button', { name: 'Remove from session' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Remove Anton Georgiev?' });
    await waitFor(() => expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.click(within(confirm).getByRole('button', { name: 'Remove' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Anton Georgiev' })).not.toBeInTheDocument();
    // The People sheet is the top overlay again once the stacked ones have unregistered.
    const people = await screen.findByRole('dialog', { name: 'People and chat' });
    expect(within(people).getByRole('list', { name: 'Everyone 9' })).toBeInTheDocument();
    expect(within(people).queryByText('Anton Georgiev')).not.toBeInTheDocument();
    // The row that opened the sheet is gone: focus lands in the People sheet, never on <body>.
    await waitFor(() => expect(people.contains(document.activeElement)).toBe(true));
  });

  it('MB4: Escape closes the student sheet alone and returns to People', async () => {
    const user = userEvent.setup();
    renderAt(MB3);
    const people = await screen.findByRole('dialog', { name: 'People and chat' });
    const more = within(people).getByRole('button', { name: 'More actions for Anton Georgiev' });
    await user.click(more);
    await screen.findByRole('dialog', { name: 'Anton Georgiev' });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Anton Georgiev' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'People and chat' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'More actions for Anton Georgiev' })).toHaveFocus(),
    );
  });

  it('MB5: the Chat tab with the composer; opening it reads the question so the pill counts two', async () => {
    renderAt(MB5);
    const sheet = within(await screen.findByRole('dialog', { name: 'People and chat' }));
    expect(sheet.getByRole('tab', { name: 'Chat' })).toHaveAttribute('aria-selected', 'true');
    expect(sheet.getByRole('tab', { name: 'Everyone' })).toHaveAttribute('aria-selected', 'true');
    expect(
      within(sheet.getByRole('list', { name: 'Messages to everyone' })).getAllByRole('listitem'),
    ).toHaveLength(3);
    expect(sheet.getByRole('textbox', { name: 'Message everyone' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2 updates', hidden: true })).toBeInTheDocument();
  });

  it('MB5: "Message" in the student sheet opens the private thread in the Chat tab with its composer focused', async () => {
    const user = userEvent.setup();
    renderAt(MB4);
    const student = within(await screen.findByRole('dialog', { name: 'Anton Georgiev' }));
    await user.click(student.getByRole('button', { name: 'Message' }));
    const sheet = within(screen.getByRole('dialog', { name: 'People and chat' }));
    expect(screen.queryByRole('dialog', { name: 'Anton Georgiev' })).not.toBeInTheDocument();
    expect(sheet.getByRole('tab', { name: /^Chat/ })).toHaveAttribute('aria-selected', 'true');
    expect(sheet.getByRole('heading', { level: 3, name: 'Anton Georgiev' })).toBeInTheDocument();
    const composer = sheet.getByRole('textbox', { name: 'Message Anton privately' });
    await waitFor(() => expect(composer).toHaveFocus());
  });

  it('MB6: the React sheet holds the Raise hand toggle and the reactions; a reaction closes it', async () => {
    const user = userEvent.setup();
    renderAt(MB6);
    const sheet = within(await screen.findByRole('dialog', { name: 'React' }));
    expect(navButton('React')).toHaveAttribute('aria-expanded', 'true');
    const hand = sheet.getByRole('button', { name: 'Raise hand' });
    expect(hand).toHaveAttribute('aria-pressed', 'false');
    await user.click(hand);
    expect(hand).toHaveAttribute('aria-pressed', 'true');
    expect(hand).toHaveTextContent('Raise hand');
    expect(within(sheet.getByRole('group', { name: 'Reactions' })).getAllByRole('button')).toHaveLength(6);
    await user.click(sheet.getByRole('button', { name: 'Thumbs up' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(navButton('React')).toHaveFocus());
    // Your tile (in Everyone: the band keeps the speaker and the hands) shows the reaction and the raised hand.
    await user.click(screen.getByRole('button', { name: '+10 more, see all 14 people' }));
    const everyone = within(await screen.findByRole('dialog', { name: 'Everyone' }));
    const you = everyone.getByRole('figure', { name: /^You, .*hand raised/ });
    expect(within(you).getByRole('img', { name: 'Reacted: Thumbs up' })).toBeInTheDocument();
  });

  it('MB7: the More sheet for a moderator, each item a button; a pick closes the sheet and says what is not built', async () => {
    const user = userEvent.setup();
    renderAt(MB7);
    const sheet = within(await screen.findByRole('dialog', { name: 'More' }));
    expect(navButton('More')).toHaveAttribute('aria-expanded', 'true');
    const present = within(sheet.getByRole('group', { name: 'Present' }));
    expect(present.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Share media',
      'Shared notes',
      'Captions',
      'Whiteboard',
    ]);
    const tools = within(sheet.getByRole('group', { name: 'Class tools' }));
    expect(tools.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Breakout rooms',
      'Poll',
      'Timer',
      'More plugins',
    ]);
    expect(sheet.getByRole('button', { name: 'Learning Analytics Dashboard' })).toBeInTheDocument();
    expect(sheet.getByRole('button', { name: 'Room settings' })).toBeInTheDocument();
    await user.click(tools.getByRole('button', { name: 'Poll' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText('Poll isn’t part of this prototype yet')).toBeInTheDocument();
  });

  it('MB8 and MB9: landscape puts the webcams beside the slide column and opens sheets from the end', async () => {
    const { unmount } = renderAt(MB8);
    expect(screen.getByRole('main')).toHaveClass('flex-row');
    expect(screen.getByRole('region', { name: 'Presentation' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Slides' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Webcams' })).getAllByRole('listitem')).toHaveLength(4);
    unmount();

    renderAt(MB9);
    const dialog = await screen.findByRole('dialog', { name: 'People and chat' });
    expect(dialog.parentElement).toHaveClass('rounded-l-xl');
    expect(dialog.parentElement).not.toHaveClass('rounded-t-xl');
  });

  it('MB10: the Everyone sheet shows every webcam on a stage surface; closing returns to See all', async () => {
    const user = userEvent.setup();
    renderAt(MB10);
    const sheet = await screen.findByRole('dialog', { name: 'Everyone' });
    expect(within(sheet).getByLabelText('14 people')).toBeInTheDocument();
    const list = within(sheet).getByRole('list', { name: 'Webcams' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(14);
    expect(list.closest('[data-surface="stage"]')).not.toBeNull();
    await user.click(within(sheet).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '+10 more, see all 14 people' })).toHaveFocus(),
    );
  });

  it('MB15: the student view has no updates, no pager, no moderator actions in the rows or More, and Raise hand', async () => {
    const user = userEvent.setup();
    renderAt(MB15);
    expect(screen.queryByRole('button', { name: /updates?$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Slides' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Presentation' })).toBeInTheDocument();
    // The teacher keeps her tile; Anton is "(you)" in the list and has no ⋯ on anyone.
    expect(screen.getByRole('figure', { name: /^Frederick/ })).toBeInTheDocument();
    await user.click(navButton('People and chat'));
    const people = within(await screen.findByRole('dialog', { name: 'People and chat' }));
    expect(people.getByRole('list', { name: 'Raised hands 4' })).toBeInTheDocument();
    expect(people.queryByRole('button', { name: /^More actions for/ })).not.toBeInTheDocument();
    expect(people.getByText('(you)').parentElement).toHaveTextContent(/^Anton Georgiev/);
    await user.keyboard('{Escape}');
    await user.click(navButton('More'));
    const more = within(await screen.findByRole('dialog', { name: 'More' }));
    expect(more.getAllByRole('button').map((b) => b.textContent)).toEqual(['', 'Shared notes', 'Captions']);
    expect(more.queryByRole('group', { name: 'Class tools' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(navButton('React'));
    const react = within(await screen.findByRole('dialog', { name: 'React' }));
    await user.click(react.getByRole('button', { name: 'Raise hand' }));
    expect(react.getByRole('button', { name: 'Raise hand' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('MB16: Leave asks first in an alert dialog with Cancel focused; cancelling returns focus to Leave', async () => {
    const user = userEvent.setup();
    renderAt(MB16);
    const confirm = await screen.findByRole('alertdialog', { name: 'Leave the session?' });
    expect(within(confirm).getByText(/You can come back with the same link/)).toBeInTheDocument();
    await waitFor(() => expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => expect(navButton('Leave session')).toHaveFocus());
    // Confirming leaves for the index.
    await user.click(navButton('Leave session'));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Leave session' }),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'BigBlueButton 4.0 prototype' }),
    ).toBeInTheDocument();
  });

  it('MB16: confirm=remove opens the Remove confirmation over the student sheet; Escape returns to its button', async () => {
    const user = userEvent.setup();
    renderAt(`${MB16}?confirm=remove`);
    const confirm = await screen.findByRole('alertdialog', { name: 'Remove Anton Georgiev?' });
    expect(hiddenDialog('Anton Georgiev')).toBeInTheDocument();
    await waitFor(() => expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Anton Georgiev' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove from session' })).toHaveFocus());
  });

  it('opens each sheet from its bar button and closes it with Escape, focus back on the button', async () => {
    const user = userEvent.setup();
    renderAt(MB1);
    for (const [name, title] of [
      ['People and chat', 'People and chat'],
      ['React', 'React'],
      ['More', 'More'],
    ] as const) {
      await user.click(navButton(name));
      const dialog = await screen.findByRole('dialog', { name: title });
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() => expect(navButton(name)).toHaveFocus());
    }
    await user.click(screen.getByRole('button', { name: '3 updates' }));
    await screen.findByRole('dialog', { name: 'Updates' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('button', { name: '3 updates' })).toHaveFocus());
    await user.click(screen.getByRole('button', { name: '+10 more, see all 14 people' }));
    await screen.findByRole('dialog', { name: 'Everyone' });
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '+10 more, see all 14 people' })).toHaveFocus(),
    );
  });

  it('a student’s raised hand reaches the band and the pill; the query overrides the props', () => {
    renderAt(`${MB1}?orient=landscape&sheet=more&people=thirty`);
    expect(screen.getByRole('main', { hidden: true })).toHaveClass('flex-row');
    expect(screen.getByRole('dialog', { name: 'More' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '+26 more, see all 30 people', hidden: true }),
    ).toBeInTheDocument();
    dispatch({ type: 'setSheet', sheet: 'none' });
    expect(screen.getByRole('button', { name: '3 updates' })).toBeInTheDocument();
    dispatch({ type: 'raiseHand', participantId: 'anton' });
    expect(screen.getByRole('button', { name: '3 updates' })).toBeInTheDocument();
    dispatch({ type: 'setSheet', sheet: 'alerts' });
    expect(screen.getByRole('button', { name: '6 hands raised' })).toBeInTheDocument();
  });
});
