/**
 * Zanderio Widget — useSocket Hook
 *
 * Manages the full Socket.IO connection lifecycle for the widget:
 *
 *   1. Creates a socket via `createSocket()` (auto-connect disabled).
 *   2. On `connect`, emits two events:
 *      • `widget:config:request` — asks the backend for remote widget
 *        appearance config (colors, position, welcome message, etc.).
 *      • `identify` — tells the backend which shop / customer this
 *        socket belongs to.
 *   3. Listens for `widget:config:response` and `SESSION_STARTED` to
 *      capture the server-assigned `storeId`, `shopperId`, and any
 *      remote widget config overrides.
 *   4. Persists the shopper ID in localStorage so returning visitors
 *      keep the same identity across sessions.
 *   5. Tears down all listeners and disconnects on unmount.
 *
 * @param {object} settings — resolved widget configuration from the host page
 * @returns {{ socket: React.MutableRefObject, storeId: string|null,
 *             shopperId: string, sessionId: string|null, remoteConfig: object|null }}
 *
 * @module hooks/use-socket
 */

import { useState, useEffect, useRef } from "react";
import {
  createSocket,
  getShopperId,
  persistShopperId,
} from "../services/socket.service";

export function useSocket(settings) {
  const socketRef = useRef(null);
  const [storeId, setStoreId] = useState(null);
  const [shopperId, setShopperId] = useState(getShopperId());
  const [sessionId, setSessionId] = useState(null);
  const [remoteConfig, setRemoteConfig] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || settings.socketUrl;
    const socket = createSocket(socketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Zanderio Widget: Socket connected, id:", socket.id);

      socket.emit("widget:config:request", { socketId: socket.id });

      socket.emit("identify", {
        shop: settings.shopUrl || settings.shopDomain || settings.shopId,
        customerId: settings.customerId,
      });
    });

    const handleSessionData = (response) => {
      console.log("Zanderio Widget: Session data received:", response);
      const data = response?.data;
      if (!data) return;

      const wc = data.widget || data.widgetConfig;
      if (wc) setRemoteConfig(wc);

      if (data.shopperId) {
        setShopperId(data.shopperId);
        persistShopperId(data.shopperId);
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      const resolved = data.storeId || data.widget?.store_id;
      if (resolved) setStoreId(resolved);
    };

    socket.on("widget:config:response", handleSessionData);
    socket.on("SESSION_STARTED", handleSessionData);
    socket.on("widget:session:started", (response) => {
      console.log("Zanderio Widget: Session started:", response);
      const data = response?.data;
      if (!data) return;

      if (data.shopperId) {
        setShopperId(data.shopperId);
        persistShopperId(data.shopperId);
      }
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
    });

    socket.on("connect_error", (err) =>
      console.error("Zanderio Widget: Socket connection error:", err),
    );

    socket.on("widget:config:invalidated", (response) => {
      console.log("Zanderio Widget: Config invalidated, applying update");
      const wc = response?.data?.widget;
      if (wc) setRemoteConfig(wc);
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("widget:config:response");
      socket.off("SESSION_STARTED");
      socket.off("widget:session:started");
      socket.off("widget:config:invalidated");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [settings]);

  return { socket: socketRef, storeId, shopperId, sessionId, remoteConfig };
}
