/**
 * Zanderio Widget — Socket.IO Service
 *
 * Stateless factory for creating Socket.IO client instances.  The hook
 * layer (`useSocket`) owns the connection lifecycle — this module only
 * handles construction and shopper identity.
 *
 * Shopper identity
 * ----------------
 * The **server** generates each shopper's `shp_`-prefixed ID on first
 * connection.  The widget only reads from `localStorage`; if nothing
 * is stored yet (first visit) it sends `null` and the realtime service
 * assigns a new ID, which the widget persists for future sessions.
 *
 * Socket construction
 * -------------------
 * `createSocket(url)` returns a socket in `autoConnect: false` mode.
 * The caller must explicitly call `.connect()` after attaching event
 * listeners.  Transports default to WebSocket with a polling fallback.
 *
 * @module services/socket.service
 */

import { io } from "socket.io-client";

const SHOPPER_ID_KEY = "zanderio_shopper_id";

/**
 * Reads the shopper ID that the server previously assigned.
 * Returns `null` on first visit (server will generate one).
 */
export function getShopperId() {
  return localStorage.getItem(SHOPPER_ID_KEY) || null;
}

/**
 * Persists the server-assigned shopper ID so it survives page refreshes.
 */
export function persistShopperId(id) {
  if (id) localStorage.setItem(SHOPPER_ID_KEY, id);
}

/**
 * Creates a new Socket.IO client pointing at the given URL.
 * The socket is created in `autoConnect: false` mode — call `.connect()` manually.
 *
 * Page context (URL, title, referrer, screen size, language) is sent in the
 * handshake query so the realtime service can create a rich Session document
 * without any extra round-trips.
 */
export function createSocket(url) {
  return io(url, {
    query: {
      shopperId: getShopperId(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer || "",
      screenWidth: window.screen?.width ?? null,
      screenHeight: window.screen?.height ?? null,
      language: navigator.language || "",
    },
    auth: { token: null },
    transports: ["websocket", "polling"],
    autoConnect: false,
  });
}
