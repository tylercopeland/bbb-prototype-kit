import { useId, useState, type ComponentProps } from 'react';
import {
  FileTrigger,
  Button as RacButton,
  ToggleButton as RacToggleButton,
  composeRenderProps,
  type Key,
} from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import type { Deck, MediaType, ScreenKind } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';
import { Button } from '../Button';
import { Tab, TabList, TabPanel, Tabs } from '../Tabs';
import { TextField } from '../TextField';
import { ToggleGroup } from '../ToggleGroup';

/**
 * The Share media picker's content (Focus.dc.html 321–409): the panel for
 * the chosen type, a hairline, then the six types along the bottom as
 * stacked icon tabs (canvas notes › Share media). The Popover around it
 * (no visible title, the close button) belongs to the action bar.
 */
export const mediaPickerStyles = tv({
  slots: {
    root: '',
    tabs: 'flex-col-reverse gap-3',
    panel: 'flex flex-col gap-2',
    decks: 'grid grid-cols-2 gap-2',
    screens: 'grid grid-cols-3 gap-2',
    rows: 'flex flex-col gap-2',
    divider: 'border-t border-border',
    actions: 'flex items-center gap-3',
    note: 'min-w-0 flex-1 text-sm text-text-muted',
    audio: 'flex items-center gap-3 px-1 py-2',
    audioIcon: 'flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent',
    audioBody: 'flex min-w-0 flex-1 flex-col',
    audioTitle: 'text-md font-bold text-text',
    audioNote: 'text-sm text-text-muted',
  },
});

/**
 * A choice card: the three screen kinds (84px, icon over label), "Add
 * slides" (a dashed card) and the More rows (44px, label on the left).
 */
export const mediaCardStyles = tv({
  base: 'flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-sunken text-sm font-bold text-text focus-ring outline-none data-hovered:bg-surface-raised data-pressed:bg-surface-raised',
  variants: {
    layout: {
      stacked: 'h-21 flex-col gap-1 p-2',
      row: 'min-h-control-touch justify-start px-3 text-md font-semibold',
      add: 'min-h-16 flex-col gap-1 border-dashed border-border-control bg-surface p-2',
    },
  },
  defaultVariants: { layout: 'stacked' },
});

export type MediaCardLayout = NonNullable<VariantProps<typeof mediaCardStyles>['layout']>;

export const mediaCardHintStyles = tv({ base: 'text-xs font-regular text-text-muted' });

/**
 * A deck card in the Slides panel: the paper thumbnail and the file name.
 * The presented deck has the selected border, fill and inset ring plus the
 * check mark, and reports `aria-checked` as a radio in its group.
 */
export const deckCardStyles = tv({
  base: 'relative flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-surface-sunken p-2 text-left text-text focus-ring outline-none data-hovered:bg-surface-raised data-pressed:bg-surface-raised data-selected:border-selected-border data-selected:bg-selected data-selected:text-selected-text data-selected:selected-ring data-selected:data-hovered:bg-selected data-selected:data-pressed:bg-selected',
});

export const deckCardPartsStyles = tv({
  slots: {
    paper:
      'flex aspect-video w-full items-start overflow-hidden rounded-control border border-border bg-slide p-2 text-xs leading-4 font-bold text-on-slide',
    paperTitle: 'line-clamp-2 break-words',
    /** Inherits the card's text: the selected pair on the selected fill. */
    file: 'truncate text-center text-xs font-bold',
    check:
      'absolute top-1 left-1 flex size-6 items-center justify-center rounded-full bg-accent text-on-accent',
  },
});

/** What the picker asks the room to do. */
export type MediaAction =
  | { type: 'deck'; index: number }
  | { type: 'addDeck'; file: string }
  | { type: 'screen'; kind: ScreenKind }
  | { type: 'video'; url: string }
  | { type: 'audio' }
  | { type: 'url'; url: string }
  | { type: 'whiteboard' }
  | { type: 'poll' }
  | { type: 'plugins' };

/** The types along the bottom, in the canvas order, each with its glyph. */
export const mediaTypes: ReadonlyArray<{ id: MediaType; label: string; icon: IconName }> = [
  { id: 'slides', label: 'Slides', icon: 'mediaSlides' },
  { id: 'video', label: 'Video', icon: 'mediaVideo' },
  { id: 'screen', label: 'Screen', icon: 'screenEntire' },
  { id: 'audio', label: 'Audio', icon: 'mediaAudio' },
  { id: 'url', label: 'URL', icon: 'mediaUrl' },
  { id: 'more', label: 'More', icon: 'more' },
];

const screenKinds: ReadonlyArray<{ kind: ScreenKind; icon: IconName; hint?: string }> = [
  { kind: 'Entire screen', icon: 'screenEntire' },
  { kind: 'A window', icon: 'screenWindow' },
  { kind: 'A browser tab', icon: 'screenTab', hint: 'Can include tab audio' },
];

const SLIDE_FILE_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/*',
];

export interface MediaPickerProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Your decks (`presentation.decks`); the first slide titles the thumbnail. */
  decks: Deck[];
  /** The presented deck. */
  deckIndex: number;
  /** The open type (`ui.mediaType`). */
  mediaType: MediaType;
  onMediaTypeChange?: (type: MediaType) => void;
  /** Every choice in the picker ends here; the room maps it to a store action. */
  onPick?: (action: MediaAction) => void;
  className?: string;
}

/**
 * One `Tabs` (D3): the type tabs are a tab list with a panel each, drawn
 * along the bottom as the canvas does, in DOM order after the panel so the
 * reading and focus order match what is seen. Slides lists your decks as a
 * radio group ("Present bbb-4-refined.pdf"), with Add slides opening the
 * file picker; Screen offers the three kinds; Video and URL take a link
 * and enable their button once one is typed; Audio starts at once; More
 * holds the whiteboard, Poll and the plugins. Every list comes from props,
 * and a room with no decks still shows Add slides.
 */
export function MediaPicker({
  decks,
  deckIndex,
  mediaType,
  onMediaTypeChange,
  onPick,
  className,
  ...props
}: MediaPickerProps) {
  const styles = mediaPickerStyles();
  const onTab = (key: Key) => {
    const next = mediaTypes.find((t) => t.id === key);
    if (next && next.id !== mediaType) onMediaTypeChange?.(next.id);
  };
  return (
    <div {...props} className={styles.root({ className })}>
      <Tabs selectedKey={mediaType} onSelectionChange={onTab} className={styles.tabs()}>
        {/* The list comes first in the DOM (React Aria links the panels to it), and the column is reversed so it is drawn along the bottom. */}
        <TabList label="Media type" variant="stacked">
          {mediaTypes.map((t) => (
            <Tab key={t.id} id={t.id} variant="stacked" icon={t.icon}>
              {t.label}
            </Tab>
          ))}
        </TabList>
        <hr className={styles.divider()} />
        <TabPanel id="slides" className={styles.panel()}>
          <SlidesPanel decks={decks} deckIndex={deckIndex} onPick={onPick} />
        </TabPanel>
        <TabPanel id="screen" className={styles.panel()}>
          <div className={styles.screens()}>
            {screenKinds.map((s) => (
              <MediaCard
                key={s.kind}
                icon={s.icon}
                hint={s.hint}
                onPress={() => onPick?.({ type: 'screen', kind: s.kind })}
              >
                {s.kind}
              </MediaCard>
            ))}
          </div>
        </TabPanel>
        <TabPanel id="video" className={styles.panel()}>
          <LinkPanel
            label="Video link"
            placeholder="Paste a YouTube, Vimeo or video file link"
            note="Playback stays in sync for everyone."
            action="Share video"
            onShare={(url) => onPick?.({ type: 'video', url })}
            upload={(file) => onPick?.({ type: 'video', url: file })}
          />
        </TabPanel>
        <TabPanel id="audio" className={styles.panel()}>
          <div className={styles.audio()}>
            <span aria-hidden="true" className={styles.audioIcon()}>
              <Icon name="mediaAudio" size="lg" />
            </span>
            <span className={styles.audioBody()}>
              <span className={styles.audioTitle()}>Share your computer’s audio</span>
              <span className={styles.audioNote()}>
                Everyone hears what plays on your computer, like music or a clip.
              </span>
            </span>
            <Button variant="primary" onPress={() => onPick?.({ type: 'audio' })}>
              Start sharing
            </Button>
          </div>
        </TabPanel>
        <TabPanel id="url" className={styles.panel()}>
          <LinkPanel
            label="Web page"
            placeholder="Paste a link to open for everyone"
            note="Each person sees the page in their own view and can scroll it."
            action="Open for everyone"
            onShare={(url) => onPick?.({ type: 'url', url })}
          />
        </TabPanel>
        <TabPanel id="more" className={styles.panel()}>
          <div className={styles.rows()}>
            <MediaCard layout="row" icon="whiteboard" onPress={() => onPick?.({ type: 'whiteboard' })}>
              Blank whiteboard
            </MediaCard>
            <MediaCard layout="row" icon="poll" onPress={() => onPick?.({ type: 'poll' })}>
              Poll
            </MediaCard>
            <MediaCard layout="row" icon="plugins" onPress={() => onPick?.({ type: 'plugins' })}>
              From a plugin…
            </MediaCard>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}

interface MediaCardProps {
  children: string;
  icon: IconName;
  hint?: string;
  layout?: MediaCardLayout;
  onPress?: () => void;
  className?: string;
}

function MediaCard({ children, icon, hint, layout = 'stacked', onPress, className }: MediaCardProps) {
  const hintId = useId();
  return (
    <RacButton
      aria-describedby={hint ? hintId : undefined}
      onPress={onPress}
      className={composeRenderProps(className, (cls) => mediaCardStyles({ layout, className: cls }))}
    >
      <Icon name={icon} size="md" />
      {children}
      {/* Hidden from the name and read back as the description, so the button is "A browser tab". */}
      {hint && (
        <span id={hintId} aria-hidden="true" className={mediaCardHintStyles()}>
          {hint}
        </span>
      )}
    </RacButton>
  );
}

function SlidesPanel({ decks, deckIndex, onPick }: Pick<MediaPickerProps, 'decks' | 'deckIndex' | 'onPick'>) {
  const styles = mediaPickerStyles();
  const hintId = useId();
  const onSelection = (keys: Set<Key>) => {
    const key = [...keys][0];
    const index = typeof key === 'string' ? Number(key) : key;
    if (typeof index === 'number' && index !== deckIndex) onPick?.({ type: 'deck', index });
  };
  return (
    <>
      <FileTrigger
        acceptedFileTypes={SLIDE_FILE_TYPES}
        onSelect={(files) => {
          const file = files?.[0];
          if (file) onPick?.({ type: 'addDeck', file: file.name });
        }}
      >
        <RacButton aria-describedby={hintId} className={mediaCardStyles({ layout: 'add' })}>
          <Icon name="upload" size="md" />
          Add slides
          <span id={hintId} aria-hidden="true" className={mediaCardHintStyles()}>
            PDF, PowerPoint or images
          </span>
        </RacButton>
      </FileTrigger>
      {decks.length > 0 && (
        <ToggleGroup
          label="Your decks"
          selectedKeys={new Set([String(deckIndex)])}
          onSelectionChange={onSelection}
          disallowEmptySelection
          className={styles.decks()}
        >
          {decks.map((deck, i) => (
            <DeckCard key={`${deck.file}-${i}`} index={i} deck={deck} />
          ))}
        </ToggleGroup>
      )}
    </>
  );
}

function DeckCard({ deck, index, className }: { deck: Deck; index: number; className?: string }) {
  const parts = deckCardPartsStyles();
  return (
    <RacToggleButton
      id={String(index)}
      aria-label={`Present ${deck.file}`}
      className={composeRenderProps(className, (cls) => deckCardStyles({ className: cls }))}
    >
      {({ isSelected }) => (
        <>
          <span aria-hidden="true" className={parts.paper()}>
            <span className={parts.paperTitle()}>{deck.slides[0] ?? deck.file}</span>
          </span>
          <span aria-hidden="true" className={parts.file()}>
            {deck.file}
          </span>
          {isSelected && (
            <span aria-hidden="true" className={parts.check()}>
              <Icon name="check" size="xs" />
            </span>
          )}
        </>
      )}
    </RacToggleButton>
  );
}

interface LinkPanelProps {
  label: string;
  placeholder: string;
  note: string;
  action: string;
  onShare: (url: string) => void;
  /** With an upload callback the panel also offers "Upload a file". */
  upload?: (file: string) => void;
}

/** A link field with its note and action; the action is disabled until a link is typed (B8: real inputs, wired buttons). */
function LinkPanel({ label, placeholder, note, action, onShare, upload }: LinkPanelProps) {
  const styles = mediaPickerStyles();
  const [url, setUrl] = useState('');
  const ready = url.trim().length > 0;
  return (
    <>
      <TextField label={label} type="url" placeholder={placeholder} value={url} onChange={setUrl} size="md" />
      <div className={styles.actions()}>
        <span className={styles.note()}>{note}</span>
        {upload && (
          <FileTrigger
            acceptedFileTypes={['video/*']}
            onSelect={(files) => {
              const file = files?.[0];
              if (file) upload(file.name);
            }}
          >
            <Button>Upload a file</Button>
          </FileTrigger>
        )}
        <Button variant="primary" isDisabled={!ready} onPress={() => onShare(url.trim())}>
          {action}
        </Button>
      </div>
    </>
  );
}
