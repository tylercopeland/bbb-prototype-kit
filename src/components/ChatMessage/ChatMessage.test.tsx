import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage', () => {
  it('renders a public message as a list item with name, time and text', () => {
    render(
      <ol>
        <ChatMessage name="Rafaela Monaco" participantId="rafaela" time="9:02">
          Will the new layout work for 25+ classes too?
        </ChatMessage>
      </ol>,
    );
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('Rafaela Monaco');
    expect(item).toHaveTextContent('9:02');
    expect(item).toHaveTextContent('Will the new layout work for 25+ classes too?');
    expect(screen.getByText('Rafaela Monaco')).toHaveClass('truncate');
    // The avatar is decoration: the name is written next to it.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders a bubble with the sender hidden in the text and the side by isSelf', () => {
    const { rerender } = render(
      <ol>
        <ChatMessage variant="bubble" name="Bruno" time="8:51">
          Do you have the link?
        </ChatMessage>
      </ol>,
    );
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent(/^Bruno: Do you have the link\?\s*8:51$/);
    expect(item).toHaveClass('self-start');
    expect(item.querySelector('p')).toHaveClass('bg-surface-sunken');
    rerender(
      <ol>
        <ChatMessage variant="bubble" isSelf name="Prof. Helena Costa" time="8:52">
          It’s in the Notes panel
        </ChatMessage>
      </ol>,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent(/^You: It’s in the Notes panel\s*8:52$/);
    expect(screen.getByRole('listitem')).toHaveClass('self-end');
    expect(screen.getByRole('listitem').querySelector('p')).toHaveClass('bg-accent', 'text-on-accent');
  });

  it('merges a className', () => {
    render(
      <ol>
        <ChatMessage name="Bruno" time="8:51" className="gap-4">
          Hi
        </ChatMessage>
      </ol>,
    );
    expect(screen.getByRole('listitem')).toHaveClass('gap-4');
    expect(screen.getByRole('listitem')).not.toHaveClass('gap-2');
  });
});
