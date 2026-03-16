/**
 * Zanderio Widget — ChatHeader
 *
 * Coloured title bar at the top of the chat window.  Displays the
 * store’s name and icon on the left and a close button (CloseIcon)
 * on the right.  Background colour is driven by `widgetConfig.color`.
 *
 * @param {{ name: string, icon: string, color: string, onClose: Function }} props
 *
 * @module components/chat-widget/chat-header
 */

import { CloseIcon } from "../icons";

export default function ChatHeader({ name, icon, color, onClose, isConfigReady }) {
  return (
    <div className="chat-header" style={{ backgroundColor: isConfigReady ? color : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {isConfigReady ? (
          <>
            <img
              src={icon}
              alt={name}
              style={{ width: "24px", height: "24px", borderRadius: "50%" }}
            />
            <h3>{name}</h3>
          </>
        ) : (
          <>
            <div className="skeleton skeleton--circle" style={{ width: "24px", height: "24px" }} />
            <div className="skeleton skeleton--text" style={{ width: "100px", height: "14px" }} />
          </>
        )}
      </div>
      <button onClick={onClose} className="icon-btn">
        <CloseIcon />
      </button>
    </div>
  );
}
