import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createRoom, POLL_TYPES, type PollSetting, type PollType } from '../../mocks';
import { PollBuilder as PollBuilderComponent, type PollBuilderProps } from './PollBuilder';

const canvasPoll = createRoom().poll;

type Draft = Pick<
  PollBuilderProps,
  'question' | 'type' | 'options' | 'anonymous' | 'liveResults' | 'multipleAnswers'
>;

/** The form holds its draft here; in the room every change is a store action. */
function Draft(props: Partial<PollBuilderProps>) {
  const [draft, setDraft] = useState<Draft>({
    question: props.question ?? canvasPoll.question,
    type: props.type ?? canvasPoll.type,
    options: props.options ?? canvasPoll.options,
    anonymous: props.anonymous ?? true,
    liveResults: props.liveResults ?? false,
    multipleAnswers: props.multipleAnswers ?? false,
  });
  return (
    <PollBuilderComponent
      {...props}
      {...draft}
      onQuestionChange={(question) => setDraft((d) => ({ ...d, question }))}
      onTypeChange={(type: PollType) =>
        setDraft((d) => ({
          ...d,
          type,
          options: type === 'choice' ? canvasPoll.options : POLL_TYPES[type].options,
        }))
      }
      onOptionChange={(index, label) =>
        setDraft((d) => ({ ...d, options: d.options.map((o, i) => (i === index ? label : o)) }))
      }
      onAddOption={() => setDraft((d) => ({ ...d, options: [...d.options, ''] }))}
      onRemoveOption={(index) =>
        setDraft((d) => ({ ...d, options: d.options.filter((_, i) => i !== index) }))
      }
      onSettingChange={(setting: PollSetting, value) => setDraft((d) => ({ ...d, [setting]: value }))}
    />
  );
}

const meta = {
  title: 'Components/PollBuilder',
  component: PollBuilderComponent,
  args: {
    question: canvasPoll.question,
    type: 'choice',
    options: canvasPoll.options,
    anonymous: true,
    liveResults: false,
    multipleAnswers: false,
  },
  argTypes: {
    type: { control: 'radio', options: ['choice', 'yesno', 'tf', 'rate'] },
    options: { control: false },
  },
  render: (args) => <Draft {...args} />,
  decorators: [
    (Story) => (
      <div className="flex h-200 w-panel flex-col rounded-panel bg-surface text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PollBuilderComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** PL1: the canvas's draft, multiple choice with four answers. */
export const Setup: Story = {};

/** Yes / No: fixed answers, nothing to add or remove. */
export const YesNo: Story = {
  args: { type: 'yesno', options: POLL_TYPES.yesno.options },
};

/** Rating 1–5: five fixed steps. */
export const Rating: Story = {
  args: { type: 'rate', options: POLL_TYPES.rate.options },
};

/** Two answers: Remove is disabled (but still named); five answers: Add is disabled. */
export const AtTheBounds: Story = {
  render: (args) => (
    <div className="flex gap-4">
      <Draft {...args} options={args.options.slice(0, 2)} />
      <Draft {...args} options={[...args.options, 'Something else']} />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="flex h-200 flex-col rounded-panel bg-surface text-text">
        <Story />
      </div>
    ),
  ],
};

/** Nothing typed yet: "Ask the class" waits for a question and answers. */
export const Empty: Story = {
  args: { question: '', options: ['', ''] },
};

/** Names visible: the fine print changes with the switch. */
export const NamesVisible: Story = {
  args: { anonymous: false },
};

/** The panel over the dark stage in Storybook's stage mode; in the room it is always a white panel. */
export const Stage: Story = {
  globals: { surface: 'stage' },
};
