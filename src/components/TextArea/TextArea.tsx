import { useState, type KeyboardEvent, type Ref } from 'react';
import {
  Label,
  TextArea as RacTextArea,
  TextField as RacTextField,
  Text,
  composeRenderProps,
  type TextFieldProps as RacTextFieldProps,
} from 'react-aria-components';
import { tv } from '../../styles/tv';
import { IconButton } from '../IconButton';
import { fieldDescriptionStyles, fieldLabelStyles, fieldStyles } from '../TextField';

/**
 * The chat composer (Focus.dc.html 474–478, 494–498; Mobile.dc.html 169):
 * one bordered box holding the text and the Send button. The box, not the
 * textarea, carries the control border and rings when the textarea has
 * keyboard focus (`focus-ring-within`, D2); the canvas drew the same box
 * with a blue border while active. Disabled fades it.
 */
export const textAreaBoxStyles = tv({
  base: 'flex items-end gap-2 rounded-lg border border-border-control bg-surface p-1 pl-3 focus-ring-within data-disabled:border-border',
});

/**
 * The textarea grows with its content (`field-sizing-content`) from one
 * 24px line to a cap of 160px, then scrolls. No border or ring of its own:
 * the box draws them. One line plus the 4px paddings is 32px, the Send
 * button's height, so a single line centres on the button.
 */
export const textAreaInputStyles = tv({
  base: 'field-sizing-content max-h-40 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1 text-md leading-6 text-text outline-none placeholder:text-text-muted data-disabled:text-text-muted',
});

export interface TextAreaProps extends Omit<
  RacTextFieldProps,
  | 'className'
  | 'children'
  | 'style'
  | 'aria-label'
  | 'aria-labelledby'
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
> {
  /** The label: "Message everyone", "Message Rafaela privately". Visually hidden in the composer. */
  label: string;
  /** @default false */
  labelHidden?: boolean;
  placeholder?: string;
  /** Help text under the box; it becomes the description. */
  description?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /**
   * Called with the trimmed text on Enter or on the Send button, never with
   * an empty message. Uncontrolled, the field clears afterwards; controlled,
   * the owner clears `value`.
   */
  onSend?: (value: string) => void;
  /** The Send button's name and tooltip. @default 'Send' */
  sendLabel?: string;
  className?: string;
  /** The textarea element. */
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * The chat composer on React Aria's TextField and TextArea, with a Send
 * IconButton beside the text (P5: a real field and a real button).
 *
 * Keys: **Enter sends**, **Shift + Enter adds a new line**. Enter during
 * IME composition is left to the IME. Escape does nothing here, so a sheet
 * around the composer can close on it. Send is disabled (but still named
 * and focusable, with its tooltip) while the message is empty.
 */
export function TextArea({
  label,
  labelHidden = false,
  placeholder,
  description,
  value: controlledValue,
  defaultValue = '',
  onChange,
  onSend,
  sendLabel = 'Send',
  isDisabled,
  isReadOnly,
  className,
  ref,
  ...props
}: TextAreaProps) {
  const [innerValue, setInnerValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : innerValue;
  const message = value.trim();
  const canSend = message.length > 0 && !isDisabled && !isReadOnly;

  const setValue = (next: string) => {
    if (!isControlled) setInnerValue(next);
    onChange?.(next);
  };

  const send = () => {
    if (!canSend) return;
    onSend?.(message);
    if (!isControlled) setInnerValue('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
  };

  return (
    <RacTextField
      {...props}
      value={value}
      onChange={setValue}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      className={composeRenderProps(className, (cls) => fieldStyles({ className: cls }))}
    >
      <Label className={fieldLabelStyles({ isHidden: labelHidden })}>{label}</Label>
      <div className={textAreaBoxStyles()} data-disabled={isDisabled || undefined}>
        <RacTextArea
          ref={ref}
          rows={1}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          className={textAreaInputStyles()}
        />
        <IconButton
          label={sendLabel}
          icon="send"
          variant="primary"
          size="sm"
          isDisabled={!canSend}
          onPress={send}
        />
      </div>
      {description && (
        <Text slot="description" className={fieldDescriptionStyles()}>
          {description}
        </Text>
      )}
    </RacTextField>
  );
}
