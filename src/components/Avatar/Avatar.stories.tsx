import type { Meta, StoryObj } from '@storybook/react-vite';
import { Focusable } from 'react-aria-components';
import { Tooltip } from '../Tooltip';
import { Avatar } from './Avatar';
import type { AvatarColor } from './avatarColor';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: {
    name: 'Rafaela Monaco',
    size: 'md',
    shape: 'circle',
    isSpeaking: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
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
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 24 / 32 / 40px. Initials are 12px (the B9 minimum) up to md, 14px at lg. */
export const Sizes: Story = {
  render: (args) => (
    <>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Avatar key={size} {...args} size={size} />
      ))}
    </>
  ),
};

/** The teacher's avatar is a rounded square; everyone else is a circle. */
export const Shapes: Story = {
  render: (args) => (
    <>
      <Avatar {...args} />
      <Avatar {...args} name="Helena Costa" shape="square" />
    </>
  ),
};

/** The ten avatar colors, every one 4.5:1 with white initials. */
export const Colors: Story = {
  render: (args) => (
    <>
      {Array.from({ length: 10 }, (_, i) => (i + 1) as AvatarColor).map((color) => (
        <Avatar key={color} {...args} name={`Color ${color}`} initials={String(color)} color={color} />
      ))}
    </>
  ),
};

/** The green ring, which is the only thing that is green in the People list. */
export const Speaking: Story = {
  args: { name: 'Frederick Dixon', isSpeaking: true },
  render: (args) => (
    <>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Avatar key={size} {...args} size={size} />
      ))}
    </>
  ),
};

/** For tiles, avatar stacks and mobile, where the row's status columns are not there (X12). */
export const Badges: Story = {
  render: (args) => (
    <>
      <Avatar {...args} name="Frederick Dixon" badge="speaking" isSpeaking />
      <Avatar {...args} name="Bruno" badge="muted" />
      <Avatar {...args} name="Cibelle Maciel" badge="hand" />
      <Avatar {...args} name="Octavio" badge="hand" size="lg" shape="square" />
      <Avatar {...args} name="Ana Souza" badge="muted" size="sm" />
    </>
  ),
};

/**
 * A speaking avatar that also has keyboard focus: the green ring stays
 * inside and the blue focus ring sits outside it. Wrapped in `Focusable`
 * with a tooltip, as a people stack would be, and autofocused.
 */
export const SpeakingAndFocused: Story = {
  tags: ['wait-for-tooltip'],
  args: { name: 'Frederick Dixon', isSpeaking: true, badge: 'speaking' },
  render: (args) => (
    <Tooltip label="Frederick Dixon, speaking">
      <Focusable autoFocus>
        <Avatar {...args} className="focus-ring" />
      </Focusable>
    </Tooltip>
  ),
};

/** Two words take the first and last initial; one word its first two letters; honorifics and "(you)" are dropped. */
export const InitialsRules: Story = {
  render: (args) => (
    <dl className="flex flex-col gap-3 text-md text-text">
      {[
        { name: 'Rafaela Monaco' },
        { name: 'Bruno' },
        { name: 'Prof. Ana Souza' },
        { name: 'Helena Costa (you)' },
        { name: 'Édouard Łukasz' },
        { name: '李小龙' },
        {
          name: 'Ana',
          id: 'ana-souza',
          initials: 'AS',
          note: 'duplicate first name, initials from the data layer',
        },
        { name: 'Ana', id: 'ana-lima', initials: 'AL', note: 'same name, another id: another color' },
      ].map((row) => (
        <div key={row.id ?? row.name} className="flex items-center gap-4">
          <dt>
            <Avatar {...args} name={row.name} id={row.id} initials={row.initials} />
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
      <Avatar {...args} name="Frederick Dixon" isSpeaking badge="speaking" />
      <Avatar {...args} name="Bruno" badge="muted" />
      <Avatar {...args} name="Cibelle Maciel" badge="hand" />
      <Avatar {...args} name="Helena Costa" shape="square" />
    </>
  ),
};
