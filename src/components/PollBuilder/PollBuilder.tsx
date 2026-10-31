import { useState, type ComponentProps, type Ref } from 'react';
import { Disclosure, DisclosurePanel } from 'react-aria-components';
import {
  canStartPoll,
  MAX_POLL_OPTIONS,
  MIN_POLL_OPTIONS,
  POLL_TYPE_ORDER,
  POLL_TYPES,
  pollOptionKey,
} from '../../mocks/poll';
import type { PollSetting, PollType } from '../../mocks/types';
import { tv } from '../../styles/tv';
import { Button } from '../Button';
import { Chip, ChipGroup } from '../ChipGroup';
import { IconButton } from '../IconButton';
import { Switch } from '../Switch';
import { TextField } from '../TextField';

/**
 * The poll setup (Focus.dc.html 503–526, PL1): the question, the answer
 * type as chips, the answers with their letters, "Add an answer", the
 * "More options" switches, and the "Ask the class" footer with its fine
 * print. The body scrolls; the footer stays.
 */
export const pollBuilderStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-1 flex-col text-text',
    body: 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4',
    section: 'flex flex-col gap-2',
    kicker: 'text-2xs font-bold tracking-label text-text-muted uppercase',
    options: 'flex list-none flex-col gap-2 p-0',
    option: 'flex items-center gap-2',
    key: 'flex size-7 shrink-0 items-center justify-center rounded-xs bg-surface-raised text-xs font-bold text-text-secondary',
    field: 'min-w-0 flex-1',
    /** A fixed answer (Yes / No, True / False, a rating step): a bordered row like the field, not editable. */
    fixed: 'flex h-control-lg min-w-0 flex-1 items-center rounded-control border border-border px-3 text-md',
    add: 'self-start',
    more: 'flex flex-col gap-1',
    switches: 'flex flex-col',
    footer: 'flex flex-col gap-2 border-t border-border px-4 pt-3 pb-4',
    hint: 'text-center text-xs text-text-muted',
  },
});

export interface PollBuilderProps extends Omit<ComponentProps<'div'>, 'children' | 'onChange'> {
  question: string;
  type: PollType;
  options: string[];
  anonymous: boolean;
  liveResults: boolean;
  multipleAnswers: boolean;
  onQuestionChange?: (question: string) => void;
  onTypeChange?: (type: PollType) => void;
  onOptionChange?: (index: number, label: string) => void;
  onAddOption?: () => void;
  onRemoveOption?: (index: number) => void;
  onSettingChange?: (setting: PollSetting, value: boolean) => void;
  /** "Ask the class". Only called when the poll can start. */
  onAsk?: () => void;
  className?: string;
  /** The question field. */
  questionRef?: Ref<HTMLInputElement>;
}

/** The fine print under "Ask the class" (Focus.dc.html 981). */
export function pollSetupHint(anonymous: boolean): string {
  return `${anonymous ? 'Anonymous' : 'Names visible to you'} · results stay with you until you show them`;
}

/**
 * Everything is a real field or control: the question is a text field,
 * the answer type a radio group (X8), each multiple-choice answer a text
 * field named "Answer A" with a "Remove answer A" button (disabled at two
 * answers, but still named), "Add an answer" disabled at five, and the
 * three switches announce on and off. "Ask the class" is disabled until
 * there is a question and every answer has text.
 */
export function PollBuilder({
  question,
  type,
  options,
  anonymous,
  liveResults,
  multipleAnswers,
  onQuestionChange,
  onTypeChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onSettingChange,
  onAsk,
  className,
  questionRef,
  ...props
}: PollBuilderProps) {
  const styles = pollBuilderStyles();
  const editable = POLL_TYPES[type].editable;
  const canAsk = canStartPoll({ question, options });
  // Whether "More options" is open is this form's own state, not the room's.
  const [moreOpen, setMoreOpen] = useState(false);
  const settings: { setting: PollSetting; label: string; value: boolean }[] = [
    { setting: 'anonymous', label: 'Anonymous answers', value: anonymous },
    { setting: 'liveResults', label: 'Students see results as they come in', value: liveResults },
    { setting: 'multipleAnswers', label: 'Allow more than one answer', value: multipleAnswers },
  ];

  return (
    <div {...props} className={styles.root({ className })}>
      <div className={styles.body()}>
        <TextField
          ref={questionRef}
          label="Question"
          value={question}
          onChange={onQuestionChange}
          placeholder="What do you want to ask?"
          isRequired
        />
        <div className={styles.section()}>
          <ChipGroup label="Answers" value={type} onChange={(value) => onTypeChange?.(value as PollType)}>
            {POLL_TYPE_ORDER.map((t) => (
              <Chip key={t} value={t}>
                {POLL_TYPES[t].label}
              </Chip>
            ))}
          </ChipGroup>
          <ul className={styles.options()}>
            {options.map((label, i) => {
              const key = pollOptionKey(type, i);
              const name = type === 'rate' ? `Rating ${i + 1}` : `Answer ${key}`;
              return (
                <li key={i} className={styles.option()}>
                  <span aria-hidden="true" className={styles.key()}>
                    {key}
                  </span>
                  {editable ? (
                    <>
                      <TextField
                        label={name}
                        labelHidden
                        value={label}
                        onChange={(value) => onOptionChange?.(i, value)}
                        placeholder="Type an answer"
                        className={styles.field()}
                      />
                      <IconButton
                        label={`Remove answer ${key}`}
                        icon="delete"
                        size="lg"
                        isDisabled={options.length <= MIN_POLL_OPTIONS}
                        onPress={() => onRemoveOption?.(i)}
                      />
                    </>
                  ) : (
                    <span className={styles.fixed()}>
                      <span className="sr-only">{name}: </span>
                      {label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              icon="increase"
              isDisabled={options.length >= MAX_POLL_OPTIONS}
              onPress={onAddOption}
              className={styles.add()}
            >
              Add an answer
            </Button>
          )}
        </div>
        <Disclosure isExpanded={moreOpen} onExpandedChange={setMoreOpen} className={styles.more()}>
          <Button
            slot="trigger"
            variant="ghost"
            size="sm"
            icon={moreOpen ? 'decrease' : 'increase'}
            className={styles.add()}
          >
            More options
          </Button>
          <DisclosurePanel className={styles.switches()}>
            {settings.map((s) => (
              <Switch
                key={s.setting}
                isSelected={s.value}
                onChange={(value) => onSettingChange?.(s.setting, value)}
              >
                {s.label}
              </Switch>
            ))}
          </DisclosurePanel>
        </Disclosure>
      </div>
      <div className={styles.footer()}>
        <Button variant="primary" size="touch" isDisabled={!canAsk} onPress={onAsk}>
          Ask the class
        </Button>
        <p className={styles.hint()}>{pollSetupHint(anonymous)}</p>
      </div>
    </div>
  );
}
