import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createRoom,
  FIXTURE_NOW,
  selectPeople,
  selectPeopleFilterCounts,
  type ParticipantFixture,
  type ParticipantId,
  type PeopleFilter,
  type RoomState,
} from '../../mocks';
import { ParticipantList } from './ParticipantList';

/** The list over a fixture, with the filter and the open menu in local state. */
function Demo({
  people = 'class',
  filter: initialFilter = 'all',
  openMenu: initialMenu = null,
}: {
  people?: ParticipantFixture;
  filter?: PeopleFilter;
  openMenu?: ParticipantId | null;
}) {
  const [state] = useState<RoomState>(() => createRoom({ participants: people }));
  const [filter, setFilter] = useState<PeopleFilter>(initialFilter);
  const [openMenu, setOpenMenu] = useState<ParticipantId | null>(initialMenu);
  const { hands, others } = selectPeople(filter)(state);
  return (
    <ParticipantList
      hands={hands}
      others={others}
      counts={selectPeopleFilterCounts(state)}
      filter={filter}
      onFilterChange={setFilter}
      now={FIXTURE_NOW}
      openMenu={openMenu}
      onMenuOpenChange={(id, open) => setOpenMenu(open ? id : null)}
    />
  );
}

const meta = {
  title: 'Components/ParticipantList',
  component: Demo,
  args: { people: 'class', filter: 'all' },
  argTypes: {
    people: { control: 'radio', options: ['one', 'four', 'class', 'thirty', 'longNames', 'duplicateNames'] },
    filter: { control: 'radio', options: ['all', 'hands', 'low'] },
  },
  decorators: [
    (Story) => (
      <div className="flex h-200 w-90 flex-col rounded-panel bg-surface">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** G1: the class, raised hands first, then everyone. */
export const Default: Story = {};

/** The Raised hands filter. */
export const RaisedHands: Story = { args: { filter: 'hands' } };

/** L1: the Low engagement filter with the insight note and the three quiet students. */
export const LowEngagement: Story = { args: { filter: 'low' } };

/** O2: the student actions menu open on Anton. */
export const MenuOpen: Story = {
  tags: ['wait-for-overlay'],
  args: { openMenu: 'anton' },
};

/** Nobody in the room at all: the chips at zero and "No one is here yet." */
export const NoParticipants: Story = {
  render: () => (
    <ParticipantList hands={[]} others={[]} counts={{ all: 0, hands: 0, low: 0 }} filter="all" now={FIXTURE_NOW} />
  ),
};

/** Alone in the room: your own row and the empty filters. */
export const OneParticipant: Story = { args: { people: 'one' } };

/** One person, Raised hands filter: the empty state. */
export const OneParticipantNoHands: Story = { args: { people: 'one', filter: 'hands' } };

/** Thirty people: the list scrolls under the chips. */
export const ThirtyParticipants: Story = { args: { people: 'thirty' } };

/** Long names truncate in the rows. */
export const LongNames: Story = { args: { people: 'longNames' } };

/** Two Anas (B9): the full names tell them apart. */
export const DuplicateNames: Story = { args: { people: 'duplicateNames' } };

export const Stage: Story = {
  globals: { surface: 'stage' },
};
