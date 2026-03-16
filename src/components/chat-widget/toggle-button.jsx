/**
 * Zanderio Widget — ToggleButton
 *
 * Floating action button (FAB) that opens or closes the chat window.
 * Shows `ChatIcon` when closed and `CloseIcon` when open.  Background
 * colour is set to the widget’s primary `color`.
 *
 * @param {{ isOpen: boolean, onClick: Function, color: string,
 *           iconUrl?: string }} props
 *
 * @module components/chat-widget/toggle-button
 */

import { CloseIcon, ChatIcon } from "../icons";

export default function ToggleButton({ isOpen, onClick, color, iconUrl, isLoading }) {
  if (isLoading) {
    return <div className="chat-toggle-btn chat-toggle-btn--skeleton" />;
  }

  return (
    <button
      className="chat-toggle-btn"
      onClick={onClick}
      style={{ backgroundColor: color }}
    >
      {isOpen ? <CloseIcon /> : <ChatIcon iconUrl={iconUrl} />}
    </button>
  );
}
