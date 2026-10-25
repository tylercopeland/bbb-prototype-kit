import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, type AvatarBadge, type AvatarProps, type AvatarSize } from './Avatar';
import type { AvatarColor } from './avatarColor';

/**
 * The component type forbids `badge` at `size="sm"`; Storybook's controls
 * want the two as independent fields, so the stories go through this
 * wrapper. The cast only widens the story args, never the component.
 */
type AvatarDemoProps = Omit<AvatarProps, 'size' | 'badge'> & { size?: AvatarSize; badge?: AvatarBadge };
const Demo = (props: AvatarDemoProps) => <Avatar {...(props as AvatarProps)} />;

const meta = {
  title: 'Components/Avatar',
  component: Demo,
  args: {
    name: 'Rafaela Monaco',
    size: 'md',
    shape: 'circle',
    isSpeaking: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'radio', options: ['circle', 'square'] },
    badge: { control: 'radio', options: [undefined, 'speaking', 'muted', 'hand'] },
    color: { control: { type: 'number', min: 1, max: 10 } },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 flex-wrap items-center gap-6 p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 24 / 32 / 40 / 48px. Initials are 12px (the B9 minimum) up to md, 14px at lg, 16px at xl (the grid tile). Badges fit md and up. */
export const Sizes: Story = {
  render: (args) => (
    <>
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Demo key={size} {...args} badge={undefined} size={size} />
      ))}
    </>
  ),
};

/** The teacher's avatar is a rounded square; everyone else is a circle. */
export const Shapes: Story = {
  render: (args) => (
    <>
      <Demo {...args} />
      <Demo {...args} name="Helena Costa" shape="square" />
    </>
  ),
};

/** The ten avatar colors, every one 4.5:1 with on-avatar initials. */
export const Colors: Story = {
  render: (args) => (
    <>
      {Array.from({ length: 10 }, (_, i) => (i + 1) as AvatarColor).map((color) => (
        <Demo key={color} {...args} name={`Color ${color}`} initials={String(color)} color={color} />
      ))}
    </>
  ),
};

/**
 * Speaking: the green ring and the speaking badge together, so the ring is
 * never the only cue. Avatar stacks (milestone 4) put an aria-hidden Avatar
 * inside a button; `ToggleButton › SpeakingAndFocused` shows the rings on a
 * focusable control.
 */
export const Speaking: Story = {
  args: { name: 'Frederick Dixon', isSpeaking: true, badge: 'speaking' },
  render: (args) => (
    <>
      <Demo {...args} size="md" />
      <Demo {...args} size="lg" />
      <Demo {...args} size="lg" shape="square" />
    </>
  ),
};

/** For tiles, avatar stacks and mobile, where the row's status columns are not there (X12). */
export const Badges: Story = {
  render: (args) => (
    <>
      <Demo {...args} name="Frederick Dixon" badge="speaking" isSpeaking />
      <Demo {...args} name="Bruno" badge="muted" />
      <Demo {...args} name="Cibelle Maciel" badge="hand" />
      <Demo {...args} name="Octavio" badge="hand" size="lg" shape="square" />
      <Demo {...args} name="Ana Souza" badge="muted" size="lg" />
    </>
  ),
};

/**
 * Two words take the first and last initial; one word its first two letters;
 * honorifics and "(you)" are dropped; CJK names take one character; nothing
 * left gives a placeholder.
 */
export const InitialsRules: Story = {
  render: (args) => (
    <dl className="flex flex-col gap-3 text-md text-text">
      {[
        { name: 'Rafaela Monaco' },
        { name: 'Bruno' },
        { name: 'Profa. Ana Souza' },
        { name: 'Helena Costa (you)' },
        { name: 'Édouard Łukasz' },
        { name: '李小龙', note: 'first character only' },
        { name: 'Dr.', note: 'nothing left after stripping' },
        {
          name: 'Ana',
          participantId: 'ana-souza',
          initials: 'AS',
          note: 'duplicate first name, initials from the data layer',
        },
        {
          name: 'Ana',
          participantId: 'ana-lima',
          initials: 'AL',
          note: 'same name, another participant: another color',
        },
      ].map((row) => (
        <div key={row.participantId ?? row.name} className="flex items-center gap-4">
          <dt>
            <Demo {...args} name={row.name} participantId={row.participantId} initials={row.initials} />
          </dt>
          <dd>
            {row.name}
            {row.note && <span className="text-text-muted"> · {row.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  ),
};

export const Stage: Story = {
  globals: { surface: 'stage' },
  render: (args) => (
    <>
      <Demo {...args} name="Frederick Dixon" isSpeaking badge="speaking" />
      <Demo {...args} name="Bruno" badge="muted" />
      <Demo {...args} name="Cibelle Maciel" badge="hand" />
      <Demo {...args} name="Helena Costa" shape="square" />
    </>
  ),
};
