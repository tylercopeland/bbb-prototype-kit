/** Count phrases that more than one component says, so they agree on their grammar. */

/** "1 raised hand", "4 raised hands": the People button's and tab's badge label. */
export function formatRaisedHands(count: number): string {
  return `${count} raised ${count === 1 ? 'hand' : 'hands'}`;
}

/** "1 unread", "3 unread": the Chat button's, tab's and Direct row's badge label. */
export function formatUnread(count: number): string {
  return `${count} unread`;
}
