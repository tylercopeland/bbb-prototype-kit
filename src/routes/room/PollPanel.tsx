/**
 * The Poll panel (PL1–PL3): the builder while the poll is being set up,
 * the results once it is live or ended, with the footer actions. Every
 * value comes from the store and every change is a store action. The
 * builder's footer is its own; the results' footer is here, because it
 * belongs to the flow (show or hide the results, end, start a new poll,
 * close).
 *
 * Focus (WCAG 2.4.3): "Ask the class" unmounts with the builder, so the
 * results' first action takes focus; "New poll" unmounts with the results,
 * so the question field takes it; hiding the results from the stage card
 * (which unmounts) lands on "Show results to everyone" through the room's
 * focus request. Close hands focus to Plugins, in `RoomScreen`.
 */
import { useEffect, useRef, type RefObject } from 'react';
import { Button, PollBuilder, PollResults } from '../../components';
import { useRoom, useRoomDispatch } from '../../mocks/context';
import { selectPollAnswered, selectPollEligible, selectPollResults } from '../../mocks/selectors';
import { tv } from '../../styles/tv';
import { useRoomFocus } from './focus';

const pollPanelStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-1 flex-col',
    body: 'min-h-0 flex-1 overflow-y-auto p-4',
    footer: 'flex gap-2 border-t border-border px-4 pt-3 pb-4',
    grow: 'flex-1',
  },
});

export interface PollPanelProps {
  /** Closes the poll (and the panel); the room moves focus to Plugins. */
  onClose?: () => void;
  /** "Show results to everyone", so the stage card's Hide can hand focus back. */
  showButtonRef?: RefObject<HTMLButtonElement | null>;
}

export function PollPanel({ onClose, showButtonRef }: PollPanelProps) {
  const styles = pollPanelStyles();
  const dispatch = useRoomDispatch();
  const { takeFocus } = useRoomFocus();
  const poll = useRoom((s) => s.poll);
  const results = useRoom(selectPollResults);
  const answered = useRoom(selectPollAnswered);
  const eligible = useRoom(selectPollEligible);

  const questionRef = useRef<HTMLInputElement>(null);
  const ownShowRef = useRef<HTMLButtonElement>(null);
  const showRef = showButtonRef ?? ownShowRef;
  // Which control takes focus after the builder and the results swap places.
  const focusAfter = useRef<'results' | 'builder' | null>(null);
  useEffect(() => {
    if (focusAfter.current === 'results' && poll.phase !== 'setup') showRef.current?.focus();
    if (focusAfter.current === 'builder' && poll.phase === 'setup') questionRef.current?.focus();
    focusAfter.current = null;
  }, [poll.phase, showRef]);
  // The stage card's Hide unmounted the card: land on the button that can show it again.
  useEffect(() => {
    if (!poll.shown && takeFocus('pollShow')) showRef.current?.focus();
  }, [poll.shown, showRef, takeFocus]);

  if (poll.phase === 'setup') {
    return (
      <PollBuilder
        question={poll.question}
        type={poll.type}
        options={poll.options}
        anonymous={poll.anonymous}
        liveResults={poll.liveResults}
        multipleAnswers={poll.multipleAnswers}
        questionRef={questionRef}
        onQuestionChange={(question) => dispatch({ type: 'setPollQuestion', question })}
        onTypeChange={(pollType) => dispatch({ type: 'setPollType', pollType })}
        onOptionChange={(index, label) => dispatch({ type: 'setPollOption', index, label })}
        onAddOption={() => dispatch({ type: 'addPollOption' })}
        onRemoveOption={(index) => dispatch({ type: 'removePollOption', index })}
        onSettingChange={(setting, value) => dispatch({ type: 'setPollSetting', setting, value })}
        onAsk={() => {
          focusAfter.current = 'results';
          dispatch({ type: 'startPoll' });
        }}
      />
    );
  }

  const phase = poll.phase === 'ended' ? 'ended' : 'live';
  return (
    <div className={styles.root()}>
      <div className={styles.body()}>
        <PollResults
          question={poll.question}
          results={results}
          answered={answered}
          eligible={eligible}
          phase={phase}
          shown={poll.shown}
          anonymous={poll.anonymous}
        />
      </div>
      <div className={styles.footer()}>
        <Button
          ref={showRef}
          variant={poll.shown ? 'secondary' : 'primary'}
          size="touch"
          onPress={() => dispatch({ type: 'showPollResults', shown: !poll.shown })}
          className={styles.grow()}
        >
          {poll.shown ? 'Hide results from everyone' : 'Show results to everyone'}
        </Button>
        {phase === 'live' ? (
          <Button size="touch" onPress={() => dispatch({ type: 'endPoll' })}>
            End poll
          </Button>
        ) : (
          <>
            <Button
              size="touch"
              onPress={() => {
                focusAfter.current = 'builder';
                dispatch({ type: 'setupPoll' });
              }}
            >
              New poll
            </Button>
            <Button size="touch" onPress={onClose}>
              Close
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
