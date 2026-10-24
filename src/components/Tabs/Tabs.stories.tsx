import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Tab, TabList, TabPanel, Tabs } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: {
    // Every story renders its own list and panels; this satisfies the required prop.
    children: null,
    defaultSelectedKey: 'people',
    orientation: 'horizontal',
    keyboardActivation: 'automatic',
  },
  argTypes: {
    children: { control: false },
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
    keyboardActivation: { control: 'radio', options: ['automatic', 'manual'] },
  },
  decorators: [
    (Story) => (
      <div className="w-80 rounded-panel bg-surface p-4 text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The panel header (Focus.dc.html 416–420): People with the raised-hand count, Chat with unread, and the panels under them (D3). */
export const PeopleAndChat: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabList label="People and chat">
        <Tab id="people" badge={{ count: 4, label: '4 raised hands' }}>
          People
        </Tab>
        <Tab id="chat" badge={{ count: 2, label: '2 unread' }}>
          Chat
        </Tab>
      </TabList>
      <TabPanel id="people">
        <p className="text-md text-text-secondary">14 people, 4 with a raised hand.</p>
      </TabPanel>
      <TabPanel id="chat">
        <p className="text-md text-text-secondary">Messages to everyone.</p>
      </TabPanel>
    </Tabs>
  ),
};

/** The chat scope (Focus.dc.html 429–431): Everyone and Direct, with unread on Direct. */
export const ChatScope: Story = {
  args: { defaultSelectedKey: 'everyone' },
  render: (args) => (
    <Tabs {...args}>
      <TabList label="Chat type">
        <Tab id="everyone">Everyone</Tab>
        <Tab id="direct" badge={{ count: 1, label: '1 unread' }}>
          Direct
        </Tab>
      </TabList>
      <TabPanel id="everyone">
        <p className="text-md text-text-secondary">Messages to everyone.</p>
      </TabPanel>
      <TabPanel id="direct">
        <p className="text-md text-text-secondary">Private conversations.</p>
      </TabPanel>
    </Tabs>
  ),
};

/** A panel with a focusable child: Tab moves from the tab to it, not to the panel. */
export const PanelWithControl: Story = {
  args: { defaultSelectedKey: 'chat' },
  render: (args) => (
    <Tabs {...args}>
      <TabList label="People and chat">
        <Tab id="people">People</Tab>
        <Tab id="chat">Chat</Tab>
      </TabList>
      <TabPanel id="people">
        <p className="text-md text-text-secondary">14 people.</p>
      </TabPanel>
      <TabPanel id="chat" className="flex flex-col gap-3">
        <p className="text-md text-text-secondary">Messages to everyone.</p>
        <Button variant="primary">Send</Button>
      </TabPanel>
    </Tabs>
  ),
};

/** Long tab labels truncate; the segments stay equal. */
export const LongLabels: Story = {
  args: { defaultSelectedKey: 'a' },
  render: (args) => (
    <Tabs {...args}>
      <TabList label="Long labels">
        <Tab id="a" badge={{ count: 120, label: '120 unread' }}>
          Everyone in the whole classroom
        </Tab>
        <Tab id="b">Direct messages with the teacher</Tab>
      </TabList>
      <TabPanel id="a">
        <p className="text-md text-text-secondary">A</p>
      </TabPanel>
      <TabPanel id="b">
        <p className="text-md text-text-secondary">B</p>
      </TabPanel>
    </Tabs>
  ),
};

/** A disabled tab is skipped by the arrow keys. */
export const Disabled: Story = {
  args: { disabledKeys: ['notes'] },
  render: (args) => (
    <Tabs {...args}>
      <TabList label="People, chat and notes">
        <Tab id="people">People</Tab>
        <Tab id="chat">Chat</Tab>
        <Tab id="notes">Notes</Tab>
      </TabList>
      <TabPanel id="people">
        <p className="text-md text-text-secondary">People.</p>
      </TabPanel>
      <TabPanel id="chat">
        <p className="text-md text-text-secondary">Chat.</p>
      </TabPanel>
      <TabPanel id="notes">
        <p className="text-md text-text-secondary">Notes.</p>
      </TabPanel>
    </Tabs>
  ),
};

/** The stage tabs over a share (Focus.dc.html 763): Slides and Screen. */
export const Stage: Story = {
  globals: { surface: 'stage' },
  args: { defaultSelectedKey: 'slides' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Tabs {...args}>
      <TabList label="What everyone sees">
        <Tab id="slides">Slides</Tab>
        <Tab id="screen">Screen</Tab>
      </TabList>
      <TabPanel id="slides">
        <p className="text-md text-text-secondary">Everyone sees your slides.</p>
      </TabPanel>
      <TabPanel id="screen">
        <p className="text-md text-text-secondary">Everyone sees your entire screen.</p>
      </TabPanel>
    </Tabs>
  ),
};
