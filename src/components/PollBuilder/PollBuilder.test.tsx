import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoom, POLL_TYPES } from '../../mocks';
import { PollBuilder, pollSetupHint, type PollBuilderProps } from './PollBuilder';

const poll = createRoom().poll;
const base: PollBuilderProps = {
  question: poll.question,
  type: 'choice',
  options: poll.options,
  anonymous: true,
  liveResults: false,
  multipleAnswers: false,
};

describe('PollBuilder', () => {
  it('is a question field, the answer types as one radio group (X8) and a named field per answer', () => {
    render(<PollBuilder {...base} />);
    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue(poll.question);
    const types = screen.getByRole('radiogroup', { name: 'Answers' });
    expect(
      within(types)
        .getAllByRole('radio')
        .map((r) => r.getAttribute('value')),
    ).toEqual(['choice', 'yesno', 'tf', 'rate']);
    expect(within(types).getByRole('radio', { name: 'Multiple choice' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Answer A' })).toHaveValue('Grey icons for muted');
    expect(screen.getByRole('textbox', { name: 'Answer D' })).toHaveValue('Text under each name');
    expect(screen.getByRole('button', { name: 'Remove answer A' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Add an answer' })).toBeEnabled();
    expect(screen.getByText(pollSetupHint(true))).toBeInTheDocument();
  });

  it('reports typing, adding, removing and the answer type', async () => {
    const user = userEvent.setup();
    const onQuestionChange = vi.fn();
    const onOptionChange = vi.fn();
    const onAddOption = vi.fn();
    const onRemoveOption = vi.fn();
    const onTypeChange = vi.fn();
    render(
      <PollBuilder
        {...base}
        onQuestionChange={onQuestionChange}
        onOptionChange={onOptionChange}
        onAddOption={onAddOption}
        onRemoveOption={onRemoveOption}
        onTypeChange={onTypeChange}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Question' }), '!');
    expect(onQuestionChange).toHaveBeenLastCalledWith(`${poll.question}!`);
    await user.type(screen.getByRole('textbox', { name: 'Answer B' }), '?');
    expect(onOptionChange).toHaveBeenLastCalledWith(1, 'A red badge on everyone?');
    await user.click(screen.getByRole('button', { name: 'Add an answer' }));
    expect(onAddOption).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Remove answer C' }));
    expect(onRemoveOption).toHaveBeenCalledWith(2);
    await user.click(screen.getByRole('radio', { name: 'Yes / No' }));
    expect(onTypeChange).toHaveBeenCalledWith('yesno');
  });

  it('keeps the fixed types read-only and stops at the bounds, with the disabled buttons still named', () => {
    const { rerender } = render(<PollBuilder {...base} type="rate" options={POLL_TYPES.rate.options} />);
    expect(screen.queryByRole('textbox', { name: /Answer|Rating/ })).not.toBeInTheDocument();
    expect(screen.getByText('Rating 3:')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add an answer' })).not.toBeInTheDocument();
    rerender(<PollBuilder {...base} options={poll.options.slice(0, 2)} />);
    expect(screen.getByRole('button', { name: 'Remove answer A' })).toHaveAttribute('aria-disabled', 'true');
    rerender(<PollBuilder {...base} options={[...poll.options, 'Something else']} />);
    expect(screen.getByRole('textbox', { name: 'Answer E' })).toHaveValue('Something else');
    expect(screen.getByRole('button', { name: 'Add an answer' })).toBeDisabled();
  });

  it('opens More options with three switches that announce their state, and keeps the trigger’s name', async () => {
    const user = userEvent.setup();
    const onSettingChange = vi.fn();
    render(<PollBuilder {...base} onSettingChange={onSettingChange} />);
    const more = screen.getByRole('button', { name: 'More options' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    await user.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(more).toHaveAccessibleName('More options');
    const anonymous = screen.getByRole('switch', { name: 'Anonymous answers' });
    expect(anonymous).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Students see results as they come in' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Allow more than one answer' })).not.toBeChecked();
    await user.click(anonymous);
    expect(onSettingChange).toHaveBeenCalledWith('anonymous', false);
    more.focus();
    await user.keyboard('{Enter}');
    expect(more).toHaveAttribute('aria-expanded', 'false');
  });

  it('disables Ask the class until there is a question and every answer has text, then asks on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onAsk = vi.fn();
    const { rerender } = render(<PollBuilder {...base} question="" onAsk={onAsk} />);
    expect(screen.getByRole('button', { name: 'Ask the class' })).toBeDisabled();
    rerender(<PollBuilder {...base} options={['Yes', ' ']} onAsk={onAsk} />);
    expect(screen.getByRole('button', { name: 'Ask the class' })).toBeDisabled();
    rerender(<PollBuilder {...base} onAsk={onAsk} />);
    const ask = screen.getByRole('button', { name: 'Ask the class' });
    expect(ask).toBeEnabled();
    await user.click(ask);
    ask.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onAsk).toHaveBeenCalledTimes(3);
  });

  it('tabs from the question through the chips, the answers and Ask the class; Escape changes nothing', async () => {
    const user = userEvent.setup();
    const onQuestionChange = vi.fn();
    render(<PollBuilder {...base} onQuestionChange={onQuestionChange} />);
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onQuestionChange).not.toHaveBeenCalled();
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Multiple choice' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Answer A' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Remove answer A' })).toHaveFocus();
  });

  it('forwards the question ref and merges a className', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(<PollBuilder {...base} questionRef={ref} className="bg-surface-sunken" />);
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Question' }));
    expect(container.firstElementChild).toHaveClass('bg-surface-sunken', 'flex');
    expect(pollSetupHint(false)).toBe('Names visible to you · results stay with you until you show them');
  });
});
