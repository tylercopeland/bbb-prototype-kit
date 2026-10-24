import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextArea } from './TextArea';

function Subject(props: Partial<React.ComponentProps<typeof TextArea>>) {
  return <TextArea label="Message everyone" labelHidden placeholder="Message everyone" {...props} />;
}

describe('TextArea', () => {
  it('is a multi-line text box named by its hidden label, with a Send button beside it', () => {
    render(<Subject />);
    const textarea = screen.getByRole('textbox', { name: 'Message everyone' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('placeholder', 'Message everyone');
    expect(screen.getByText('Message everyone', { selector: 'label' })).toHaveClass('sr-only');
    const send = screen.getByRole('button', { name: 'Send' });
    expect(textarea.compareDocumentPosition(send) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows a visible label when asked', () => {
    render(<Subject labelHidden={false} />);
    expect(screen.getByText('Message everyone', { selector: 'label' })).not.toHaveClass('sr-only');
  });

  it('sends the trimmed text on Enter and clears', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Subject onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: 'Message everyone' });
    await user.type(textarea, '  Hello everyone  {Enter}');
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('Hello everyone');
    expect(textarea).toHaveValue('');
    expect(textarea).toHaveFocus();
  });

  it('adds a new line on Shift + Enter instead of sending', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Subject onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: 'Message everyone' });
    await user.type(textarea, 'Line one{Shift>}{Enter}{/Shift}Line two');
    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Line one\nLine two');
  });

  it('does not send an empty message, and Send is disabled until there is text', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Subject onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: 'Message everyone' });
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toHaveAttribute('aria-disabled', 'true');
    await user.type(textarea, '   {Enter}');
    expect(onSend).not.toHaveBeenCalled();
    await user.clear(textarea);
    await user.type(textarea, 'Hi');
    expect(screen.getByRole('button', { name: 'Send' })).not.toHaveAttribute('aria-disabled');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith('Hi');
    expect(textarea).toHaveValue('');
  });

  it('leaves Enter to the IME while composing', async () => {
    const onSend = vi.fn();
    render(<Subject onSend={onSend} defaultValue="こんにちは" />);
    const textarea = screen.getByRole('textbox', { name: 'Message everyone' });
    textarea.focus();
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    Object.defineProperty(event, 'isComposing', { value: true });
    textarea.dispatchEvent(event);
    expect(onSend).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('is reached by Tab, then Send; Escape does nothing here', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Subject onSend={onSend} defaultValue="Hi" />);
    const textarea = screen.getByRole('textbox', { name: 'Message everyone' });
    await user.tab();
    expect(textarea).toHaveFocus();
    expect(textarea).toHaveAttribute('data-focus-visible');
    expect(textarea.parentElement).toHaveClass('focus-ring-within');
    await user.keyboard('{Escape}');
    expect(textarea).toHaveFocus();
    expect(textarea).toHaveValue('Hi');
    await user.tab();
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('Hi');
    await user.keyboard(' ');
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('works controlled: the owner clears the value after sending', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    function Owner() {
      const [value, setValue] = useState('Draft');
      return (
        <Subject
          value={value}
          onChange={setValue}
          onSend={(message) => {
            onSend(message);
            setValue('');
          }}
        />
      );
    }
    render(<Owner />);
    const textarea = screen.getByRole('textbox', { name: 'Message everyone' });
    expect(textarea).toHaveValue('Draft');
    await user.type(textarea, ' two{Enter}');
    expect(onSend).toHaveBeenCalledWith('Draft two');
    expect(textarea).toHaveValue('');
  });

  it('describes the field and grows with its content up to a cap', () => {
    render(<Subject description="Enter sends, Shift + Enter adds a line" />);
    const textarea = screen.getByRole('textbox', { name: 'Message everyone' });
    expect(textarea).toHaveAccessibleDescription('Enter sends, Shift + Enter adds a line');
    expect(textarea).toHaveClass('field-sizing-content', 'max-h-40', 'resize-none');
    expect(textarea).toHaveAttribute('rows', '1');
  });

  it('disables the field and Send together', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Subject isDisabled defaultValue="Hi" onSend={onSend} />);
    expect(screen.getByRole('textbox', { name: 'Message everyone' })).toBeDisabled();
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toHaveAttribute('aria-disabled', 'true');
    await user.click(send);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('forwards its ref to the textarea and merges a className on the root', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Subject ref={ref} className="gap-2" />);
    const textarea = screen.getByRole('textbox', { name: 'Message everyone' });
    expect(ref.current).toBe(textarea);
    const root = textarea.closest('.gap-2');
    expect(root).not.toBeNull();
    expect(root).not.toHaveClass('gap-1');
  });
});
