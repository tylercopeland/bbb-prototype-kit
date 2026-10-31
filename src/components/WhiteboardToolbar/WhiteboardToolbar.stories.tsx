import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { InkColor, WhiteboardTool } from '../../mocks';
import { inkColors, whiteboardTools, WhiteboardToolbar } from './WhiteboardToolbar';

const meta = {
  title: 'Components/WhiteboardToolbar',
  component: WhiteboardToolbar,
  args: {
    tool: 'pen',
    color: 'amber',
  },
  argTypes: {
    tool: { control: 'radio', options: whiteboardTools.map((t) => t.id) },
    color: { control: 'radio', options: inkColors.map((c) => c.id) },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WhiteboardToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The canvas's state (Focus.dc.html 1090, 122): the pen with the orange (amber) ink. */
export const Default: Story = {};

/** Every tool once, so each glyph is seen selected. */
export const Tools: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {whiteboardTools.map((t) => (
        <WhiteboardToolbar key={t.id} {...args} tool={t.id} />
      ))}
    </div>
  ),
};

/** Every ink once. */
export const Inks: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {inkColors.map((c) => (
        <WhiteboardToolbar key={c.id} {...args} color={c.id} />
      ))}
    </div>
  ),
};

/** Wired to local state: the arrow keys move the choice within each group, Tab moves between them. */
function Interactive(props: React.ComponentProps<typeof WhiteboardToolbar>) {
  const [tool, setTool] = useState<WhiteboardTool>(props.tool);
  const [color, setColor] = useState<InkColor>(props.color);
  return (
    <WhiteboardToolbar {...props} tool={tool} color={color} onToolChange={setTool} onColorChange={setColor} />
  );
}

export const Playground: Story = {
  render: (args) => <Interactive {...args} />,
};

/** Over the slide inside the stage: the dark card the stage tokens give it (milestone 4 decision), on the white paper. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  decorators: [
    (Story) => (
      <div className="flex items-end justify-end rounded-tile bg-slide p-4">
        <Story />
      </div>
    ),
  ],
};
