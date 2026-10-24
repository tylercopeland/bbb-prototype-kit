import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenSheet } from './TokenSheet';

const meta = {
  title: 'Foundations/Tokens',
  component: TokenSheet,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TokenSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every color, text size, radius and control height. Use the toolbar to switch theme and surface. */
export const Light: Story = {};

export const Dark: Story = {
  globals: { theme: 'dark' },
};

export const Stage: Story = {
  globals: { surface: 'stage' },
};
