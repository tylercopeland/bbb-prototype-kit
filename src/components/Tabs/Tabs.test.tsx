import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { Tab, TabList, TabPanel, Tabs } from './Tabs';

function Subject(props: Partial<React.ComponentProps<typeof Tabs>>) {
  return (
    <Tabs defaultSelectedKey="people" {...props}>
      <TabList label="People and chat">
        <Tab id="people" badge={{ count: 4, label: '4 raised hands' }}>
          People
        </Tab>
        <Tab id="chat" badge={{ count: 2, label: '2 unread' }}>
          Chat
        </Tab>
        <Tab id="notes">Shared notes</Tab>
      </TabList>
      <TabPanel id="people">People list</TabPanel>
      <TabPanel id="chat">
        <Button>Send</Button>
      </TabPanel>
      <TabPanel id="notes">Notes</TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('is a named tab list with tabs above one visible panel', () => {
    render(<Subject />);
    const list = screen.getByRole('tablist', { name: 'People and chat' });
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('People list');
    expect(panel).toHaveAttribute('aria-labelledby', tabs[0].id);
    // The list precedes its panel in the DOM (D3: tabs above content).
    expect(list.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('names a tab by its text and badge label', () => {
    render(<Subject />);
    expect(screen.getByRole('tab', { name: 'People 4 raised hands' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Chat 2 unread' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Shared notes' })).toBeInTheDocument();
  });

  it('selects with the arrow keys, wraps, and Home / End jump', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Subject onSelectionChange={onSelectionChange} />);
    const [people, chat, notes] = screen.getAllByRole('tab');
    await user.tab();
    expect(people).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(chat).toHaveFocus();
    expect(chat).toHaveAttribute('aria-selected', 'true');
    expect(onSelectionChange).toHaveBeenLastCalledWith('chat');
    expect(screen.getByRole('tabpanel')).toContainElement(screen.getByRole('button', { name: 'Send' }));
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(notes).toHaveFocus();
    await user.keyboard('{Home}');
    expect(people).toHaveFocus();
    await user.keyboard('{End}');
    expect(notes).toHaveFocus();
  });

  it('moves with Tab from the selected tab into the panel, and Enter and Space select on press', async () => {
    const user = userEvent.setup();
    render(<Subject keyboardActivation="manual" />);
    const [people, chat] = screen.getAllByRole('tab');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(chat).toHaveFocus();
    expect(people).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(chat).toHaveAttribute('aria-selected', 'true');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Send' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(chat).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    await user.keyboard(' ');
    expect(people).toHaveAttribute('aria-selected', 'true');
    // A panel without a focusable child is focusable itself.
    await user.tab();
    expect(screen.getByRole('tabpanel')).toHaveFocus();
  });

  it('ignores Escape and keeps focus on the tab', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    await user.tab();
    await user.keyboard('{Escape}');
    expect(screen.getAllByRole('tab')[0]).toHaveFocus();
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('marks the selected tab with the inset ring, not color alone, and shows the focus ring', async () => {
    const user = userEvent.setup();
    render(<Subject />);
    const [people, chat] = screen.getAllByRole('tab');
    expect(people).toHaveAttribute('data-selected');
    expect(people).toHaveClass('data-selected:selected-ring', 'focus-ring');
    expect(chat).not.toHaveAttribute('data-selected');
    await user.tab();
    expect(people).toHaveAttribute('data-focus-visible');
  });

  it('can be controlled', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Subject defaultSelectedKey={undefined} selectedKey="chat" onSelectionChange={onSelectionChange} />,
    );
    expect(screen.getByRole('tab', { name: 'Chat 2 unread' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Shared notes' }));
    expect(onSelectionChange).toHaveBeenCalledWith('notes');
    expect(screen.getByRole('tab', { name: 'Chat 2 unread' })).toHaveAttribute('aria-selected', 'true');
  });

  it('skips a disabled tab', async () => {
    const user = userEvent.setup();
    render(<Subject disabledKeys={['chat']} />);
    const [people, chat, notes] = screen.getAllByRole('tab');
    expect(chat).toHaveAttribute('aria-disabled', 'true');
    await user.tab();
    expect(people).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(notes).toHaveFocus();
  });

  it('forwards refs to the tabs root, the list, a tab and the panel', () => {
    const root = createRef<HTMLDivElement>();
    const list = createRef<HTMLDivElement>();
    const tab = createRef<HTMLDivElement>();
    const panel = createRef<HTMLDivElement>();
    render(
      <Tabs ref={root} defaultSelectedKey="a">
        <TabList ref={list} label="Test">
          <Tab ref={tab} id="a">
            A
          </Tab>
        </TabList>
        <TabPanel ref={panel} id="a">
          Panel A
        </TabPanel>
      </Tabs>,
    );
    expect(list.current).toBe(screen.getByRole('tablist'));
    expect(tab.current).toBe(screen.getByRole('tab'));
    expect(panel.current).toBe(screen.getByRole('tabpanel'));
    expect(root.current).toContainElement(list.current);
  });

  it('merges a consumer className on the list and a tab', () => {
    render(
      <Tabs defaultSelectedKey="a">
        <TabList label="Test" className="w-64 rounded-full">
          <Tab id="a" className="h-control-md">
            A
          </Tab>
        </TabList>
        <TabPanel id="a">Panel A</TabPanel>
      </Tabs>,
    );
    const list = screen.getByRole('tablist');
    expect(list).toHaveClass('w-64', 'rounded-full', 'bg-surface-sunken');
    expect(list).not.toHaveClass('rounded-control');
    const tab = screen.getByRole('tab');
    expect(tab).toHaveClass('h-control-md');
    expect(tab).not.toHaveClass('h-control-sm');
  });
});
