/**
 * Zanderio Widget — Socket.IO Service
 *
 * Stateless factory for creating Socket.IO client instances.
 *
 * @module services/socket.service
 */

import { io } from "socket.io-client";

const VISITOR_ID_KEY = "zanderio_visitor_id";

export function getVisitorId() {
  return localStorage.getItem(VISITOR_ID_KEY) || null;
}

export function persistVisitorId(id) {
  if (id) localStorage.setItem(VISITOR_ID_KEY, id);
}

export function createSocket(url, options = {}) {
  const { storeId } = options;

  return io(url, {
    query: {
      visitorId: getVisitorId(),
      language: navigator.language || "",
      ...(storeId ? { storeId } : {}),
    },
    auth: { token: null },
    transports: ["websocket", "polling"],
    autoConnect: false,
  });
}
