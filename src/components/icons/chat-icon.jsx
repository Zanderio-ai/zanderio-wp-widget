/**
 * Zanderio Widget — ChatIcon
 *
 * Displays the widget’s chat icon — either a custom URL provided via
 * remote config (`iconUrl`) or the default `zanderio-chat-icon.png` asset.
 * Rendered inside the ToggleButton when the chat window is closed.
 *
 * @param {{ iconUrl?: string }} props
 *
 * @module components/icons/chat-icon
 */

import zanderioIcon from "../../assets/zanderio-chat-icon.png";

export default function ChatIcon({ iconUrl }) {
  return (
    <img
      src={iconUrl || zanderioIcon}
      alt="Chat"
      style={{ width: "32px", height: "32px", borderRadius: "50%" }}
    />
  );
}
