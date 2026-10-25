import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from './Icon';
import { icons, type IconName } from './icons';

type Entry = { meaning: string; used: string; note?: string };

/** One row per icon. The record type makes a missing entry a type error. */
const entries: Record<IconName, Entry> = {
  microphone: { meaning: 'Microphone on', used: 'Action bar (ToggleButton selected), People row mic column' },
  microphoneOff: {
    meaning: 'Microphone off / muted',
    used: 'Action bar (ToggleButton), People row, tile badge',
    note: '"Mute everyone" in the People header is a different meaning and gets its own glyph in milestone 4',
  },
  speaking: {
    meaning: 'Speaking now',
    used: 'People row (green disc), Avatar badge, tile badge',
    note: 'Distinct from microphone on: the green disc with bars means sound right now',
  },
  listenOnly: {
    meaning: 'Listening only',
    used: 'People row mic column',
    note: 'Muted and listening used to look alike: muted is a struck mic, listening is headphones',
  },
  audioNotJoined: { meaning: 'Audio not joined', used: 'People row mic column, the Join audio button' },
  camera: { meaning: 'Camera on', used: 'Action bar (ToggleButton selected), People row camera column' },
  cameraOff: { meaning: 'Camera off', used: 'Action bar (ToggleButton), student actions menu' },
  shareMedia: { meaning: 'Share media', used: 'Action bar' },
  react: { meaning: 'React', used: 'Action bar, mobile React sheet' },
  raiseHand: {
    meaning: 'Raise hand / hand raised',
    used: 'Action bar (ToggleButton), People row second line, Avatar badge, tile badge',
    note: 'The canvas drew two different hand glyphs; this is the one',
  },
  leave: { meaning: 'Leave session', used: 'Action bar' },
  people: { meaning: 'People', used: 'Action bar panel buttons, mobile bar' },
  chat: { meaning: 'Chat / message privately', used: 'Action bar panel buttons, People row action' },
  notes: { meaning: 'Shared notes', used: 'Action bar panel buttons' },
  plugins: { meaning: 'Plugins', used: 'Action bar panel buttons' },
  breakouts: {
    meaning: 'Breakout rooms',
    used: 'Plugins menu',
    note: 'An open door, not a third grid: the 2 by 2 grid read like All slides and See all webcams',
  },
  slidesOverview: {
    meaning: 'All slides',
    used: 'Presentation controls, mobile pager',
    note: 'One grid icon meant both All slides and See all webcams; slides keep the layout grid',
  },
  webcamsAll: {
    meaning: 'See all webcams',
    used: 'Webcam strip, mobile See all',
    note: 'Now a 3 by 3 grid, distinct from All slides',
  },
  presenter: { meaning: 'Presenter', used: 'People row second line, student actions menu' },
  whiteboardAccess: {
    meaning: 'Whiteboard access',
    used: 'Student actions menu',
    note: 'Whiteboard and Annotate shared a pencil; access is a pen on a board',
  },
  annotate: { meaning: 'Annotate', used: 'Mobile pager, presentation controls', note: 'The plain pencil' },
  more: {
    meaning: 'More options / more actions',
    used: 'Panel headers, action bar overflow, People row action',
    note: 'One glyph for one meaning: the row action no longer has its own vertical dots',
  },
  close: { meaning: 'Close', used: 'Panel headers, dialogs, sheets' },
  settings: { meaning: 'Settings', used: 'Session header, More menu' },
  analytics: { meaning: 'Learning analytics', used: 'Session header' },
  insight: { meaning: 'Insight', used: 'Alert pill, People filter' },
  poll: { meaning: 'Poll', used: 'Plugins menu, poll panel' },
  timer: { meaning: 'Timer', used: 'Plugins menu, timer card and pill' },
  externalLink: { meaning: 'Opens in a new tab', used: 'Learning analytics tooltip' },
  captions: { meaning: 'Captions', used: 'More menu' },
  recording: { meaning: 'Recording', used: 'Session header, More menu' },
  shortcuts: { meaning: 'Keyboard shortcuts', used: 'More menu' },
  moderator: { meaning: 'Moderator', used: 'Student actions menu' },
  lockChat: { meaning: 'Lock public chat', used: 'Student actions menu' },
  removeFromSession: { meaning: 'Remove from session', used: 'Student actions menu' },
  submenu: { meaning: 'Opens a submenu', used: 'Menu items with a submenu ("Move to…")' },
  info: { meaning: 'Information', used: 'Neutral toasts' },
  error: { meaning: 'Error or warning', used: 'Danger toasts' },
  send: { meaning: 'Send a message', used: 'Chat composer (TextArea)' },
  increase: { meaning: 'More / increase by one', used: 'Stepper (+)' },
  decrease: { meaning: 'Fewer / decrease by one', used: 'Stepper (−)' },
  select: { meaning: 'Select tool', used: 'Whiteboard tools (ToggleGroup)' },
  shapes: { meaning: 'Shapes tool', used: 'Whiteboard tools (ToggleGroup)' },
  text: { meaning: 'Text tool', used: 'Whiteboard tools (ToggleGroup)' },
  eraser: { meaning: 'Eraser tool', used: 'Whiteboard tools (ToggleGroup)' },
  person: {
    meaning: 'Webcam placeholder',
    used: 'VideoTile with the camera on',
    note: 'The prototype has no real video; the glyph stands in for the picture',
  },
  back: { meaning: 'Back', used: 'DM thread header (back to the Direct list)' },
  private: {
    meaning: 'Private conversation',
    used: 'DM thread header, DM composer',
    note: 'A different meaning from lockChat (a moderator locking public chat), so a different glyph',
  },
  question: { meaning: 'Question asked in chat', used: 'AlertPill (session header)' },
  help: { meaning: 'Help requested by a breakout room', used: 'AlertPill (session header), room cards (milestone 5)' },
  minimize: { meaning: 'Minimize presentation', used: 'Stage (presentation controls)' },
  restore: { meaning: 'Restore presentation', used: 'Stage (minimized presentation tile)' },
};

const names = Object.keys(icons) as IconName[];

/** The whole set: glyph, meaning, name, where it is used, and which X6 conflict it resolves. */
function IconTable() {
  return (
    <div className="rounded-panel bg-surface p-6 text-text">
      <table className="w-full border-collapse text-md">
        <caption className="pb-4 text-left text-xl font-semibold">Icon set: one icon per meaning</caption>
        <thead>
          <tr>
            {['Glyph', 'Meaning', 'Icon name', 'Used in', 'Conflict resolved'].map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b border-border px-3 py-2 text-left text-2xs font-semibold tracking-label text-text-muted uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((name) => (
            <tr key={name}>
              <td className="border-b border-border px-3 py-2">
                <Icon name={name} size="md" className="text-icon" />
              </td>
              <td className="border-b border-border px-3 py-2 font-semibold">{entries[name].meaning}</td>
              <td className="border-b border-border px-3 py-2">
                <code className="font-mono text-sm">{name}</code>
              </td>
              <td className="border-b border-border px-3 py-2 text-text-secondary">{entries[name].used}</td>
              <td className="border-b border-border px-3 py-2 text-text-secondary">{entries[name].note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: 'Foundations/Icons',
  component: IconTable,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof IconTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every icon in the set, by meaning (X6). */
export const Set: Story = {};

/** The four sizes, 12 / 16 / 20 / 24px, from the `component.icon.*` tokens. */
export const Sizes: Story = {
  render: () => (
    <ul className="flex items-end gap-6 p-6 text-icon">
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <li key={size} className="flex flex-col items-center gap-2">
          <Icon name="microphone" size={size} />
          <span className="text-xs text-text-muted">{size}</span>
        </li>
      ))}
    </ul>
  ),
};

export const Stage: Story = {
  globals: { surface: 'stage' },
};
