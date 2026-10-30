import { useId, type ComponentProps } from 'react';
import { Button as RacButton, composeRenderProps } from 'react-aria-components';
import { Icon, type IconName } from '../../icons';
import type { PluginEntry } from '../../mocks/types';
import { tv, type VariantProps } from '../../styles/tv';

/**
 * The Plugins picker's content (Focus.dc.html 211–233): the three featured
 * cards in a row, then the "More plugins" kicker and its rows. The Popover
 * around it (title "Plugins", the close button) belongs to the action bar.
 */
export const pluginsMenuStyles = tv({
  slots: {
    root: 'flex flex-col gap-3',
    featured: 'grid grid-cols-3 gap-2',
    kicker: 'px-1 text-2xs font-bold tracking-label text-text-muted uppercase',
    more: 'flex flex-col',
    empty: 'px-1 py-2 text-sm text-text-muted',
  },
});

/** A featured card: 96px tall, icon tile over the label and its state line. */
export const pluginCardStyles = tv({
  base: 'flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface p-2 text-center focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
});

/** The tinted icon tile and the two lines inside a featured card; the tint follows the canvas (amber, blue, green). */
export const pluginCardPartsStyles = tv({
  slots: {
    tile: 'flex size-10 items-center justify-center rounded-lg',
    label: 'text-sm leading-4 font-bold text-text',
    description: 'text-xs text-text-muted',
  },
  variants: {
    tone: {
      hand: { tile: 'bg-status-hand-soft text-status-hand-text' },
      accent: { tile: 'bg-accent-soft text-accent' },
      live: { tile: 'bg-status-live-soft text-status-live-text' },
      neutral: { tile: 'bg-surface-raised text-icon' },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type PluginCardTone = NonNullable<VariantProps<typeof pluginCardPartsStyles>['tone']>;

/** A "More plugins" row: 44px, icon tile, label and description, a chevron. */
export const pluginRowStyles = tv({
  base: 'flex min-h-control-touch w-full items-center gap-3 rounded-control px-2 py-1 text-left focus-ring outline-none data-hovered:bg-surface-sunken data-pressed:bg-surface-sunken',
});

export const pluginRowPartsStyles = tv({
  slots: {
    tile: 'flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-raised text-icon',
    body: 'flex min-w-0 flex-1 flex-col',
    label: 'truncate text-md font-semibold text-text',
    description: 'truncate text-xs text-text-muted',
    chevron: 'shrink-0 text-icon-subtle',
  },
});

/** The glyph for a plugin id; anything unknown gets the Plugins glyph. */
const pluginIcons: Record<string, IconName> = {
  breakouts: 'breakouts',
  poll: 'poll',
  timer: 'timer',
  qa: 'qaBoard',
  quiz: 'quiz',
  wordcloud: 'wordCloud',
  picker: 'randomPicker',
};

const pluginTones: Record<string, PluginCardTone> = { breakouts: 'hand', poll: 'accent', timer: 'live' };

export interface PluginsMenuProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The big cards (`plugins.featured`). */
  featured: PluginEntry[];
  /** The rows under "More plugins" (`plugins.more`). */
  more: PluginEntry[];
  /** The featured cards' state line by id (`selectPluginSubtitles`: "4 rooms set up", "1 draft ready", "Not running"). */
  subtitles?: Record<string, string>;
  /** Called with the plugin's id. The room opens the breakout surface, the poll panel or the timer. */
  onPick?: (id: string) => void;
  className?: string;
}

/**
 * Every plugin is a button named by its label and described by its state
 * or description, so the featured cards read "Breakout rooms, 4 rooms set
 * up" and the rows "Q&A board, Collect and upvote questions". Both lists
 * come from the store (X15), and either can be empty.
 */
export function PluginsMenu({
  featured,
  more,
  subtitles = {},
  onPick,
  className,
  ...props
}: PluginsMenuProps) {
  const styles = pluginsMenuStyles();
  return (
    <div {...props} className={styles.root({ className })}>
      {featured.length > 0 && (
        <div role="group" aria-label="Featured plugins" className={styles.featured()}>
          {featured.map((p) => (
            <PluginCard key={p.id} plugin={p} subtitle={subtitles[p.id]} onPress={() => onPick?.(p.id)} />
          ))}
        </div>
      )}
      <p className={styles.kicker()}>More plugins</p>
      {more.length === 0 ? (
        <p className={styles.empty()}>No other plugins are installed.</p>
      ) : (
        <div role="group" aria-label="More plugins" className={styles.more()}>
          {more.map((p) => (
            <PluginRow key={p.id} plugin={p} onPress={() => onPick?.(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

interface PluginItemProps {
  plugin: PluginEntry;
  subtitle?: string;
  onPress?: () => void;
  className?: string;
}

function PluginCard({ plugin, subtitle, onPress, className }: PluginItemProps) {
  const parts = pluginCardPartsStyles({ tone: pluginTones[plugin.id] });
  const descriptionId = useId();
  const description = subtitle ?? plugin.description;
  return (
    <RacButton
      aria-describedby={description ? descriptionId : undefined}
      onPress={onPress}
      className={composeRenderProps(className, (cls) => pluginCardStyles({ className: cls }))}
    >
      <span aria-hidden="true" className={parts.tile()}>
        <Icon name={pluginIcons[plugin.id] ?? 'plugins'} size="md" />
      </span>
      <span className={parts.label()}>{plugin.label}</span>
      {/* Hidden from the name and read back as the description: "Breakout rooms, 4 rooms set up". */}
      {description && (
        <span id={descriptionId} aria-hidden="true" className={parts.description()}>
          {description}
        </span>
      )}
    </RacButton>
  );
}

function PluginRow({ plugin, onPress, className }: PluginItemProps) {
  const parts = pluginRowPartsStyles();
  const descriptionId = useId();
  return (
    <RacButton
      aria-describedby={plugin.description ? descriptionId : undefined}
      onPress={onPress}
      className={composeRenderProps(className, (cls) => pluginRowStyles({ className: cls }))}
    >
      <span aria-hidden="true" className={parts.tile()}>
        <Icon name={pluginIcons[plugin.id] ?? 'plugins'} size="sm" />
      </span>
      <span className={parts.body()}>
        <span className={parts.label()}>{plugin.label}</span>
        {plugin.description && (
          <span id={descriptionId} aria-hidden="true" className={parts.description()}>
            {plugin.description}
          </span>
        )}
      </span>
      <Icon name="submenu" size="sm" className={parts.chevron()} />
    </RacButton>
  );
}
