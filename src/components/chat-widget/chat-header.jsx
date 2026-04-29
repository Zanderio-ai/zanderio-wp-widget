/**
 * Zanderio Widget — ChatHeader
 *
 * Coloured title bar at the top of the chat window.  Displays the
 * store's name and icon on the left and a close button (CloseIcon)
 * on the right.  Background colour is driven by `widgetConfig.color`.
 *
 * @param {{ name: string, icon: string, color: string, onClose: Function }} props
 *
 * @module components/chat-widget/chat-header
 */

import { useState } from "react";
import { LuExpand, LuShrink, LuMaximize2, LuMinimize2 } from "react-icons/lu";

function TooltipButton({ onClick, label, tooltip, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={onClick}
        className="icon-btn"
        aria-label={label}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </button>
      {visible && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.88)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            padding: "4px 8px",
            borderRadius: "6px",
            pointerEvents: "none",
            zIndex: 99999,
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

export default function ChatHeader({
  name,
  icon,
  isConfigReady,
  isExpanded,
  isFullscreen,
  onToggleExpand,
  onToggleFullscreen,
}) {
  return (
    <div className="chat-header" style={{ backgroundColor: isConfigReady ? "var(--widget-accent)" : undefined }}>
      <div className="chat-header__brand">
        {isConfigReady ? (
          <>
            <img src={icon} alt={name} className="chat-header__avatar" />
            <h3 className="chat-header__name">{name}</h3>
          </>
        ) : (
          <>
            <div className="skeleton skeleton--circle" style={{ width: "24px", height: "24px" }} />
            <div className="skeleton skeleton--text" style={{ width: "100px", height: "14px" }} />
          </>
        )}
      </div>
      <div className="chat-header__actions">
        <TooltipButton
          onClick={onToggleExpand}
          label={isExpanded ? "Default View" : "Expanded View"}
          tooltip={isExpanded ? "Default View" : "Expanded View"}
        >
          {isExpanded ? <LuMinimize2 size={15} /> : <LuMaximize2 size={15} />}
        </TooltipButton>
        <TooltipButton
          onClick={onToggleFullscreen}
          label={isFullscreen ? "Exit Full Screen" : "Full Screen View"}
          tooltip={isFullscreen ? "Exit Full Screen" : "Full Screen View"}
        >
          {isFullscreen ? <LuShrink size={15} /> : <LuExpand size={15} />}
        </TooltipButton>
      </div>
    </div>
  );
}
