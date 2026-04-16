/**
 * Zanderio Widget — useSocket Hook
 *
 * Manages the full Socket.IO connection lifecycle for the widget.
 *
 * @param {object} settings
 * @returns {{ socket: React.MutableRefObject, storeId: string|null,
 *             visitorId: string, sessionId: string|null, remoteConfig: object|null }}
 *
 * @module hooks/use-socket
 */

import { useState, useEffect, useRef } from "react";
import {
  createSocket,
  getVisitorId,
  persistVisitorId,
} from "../services/socket.service";

export function useSocket(settings) {
  const socketRef = useRef(null);
  const [storeId, setStoreId] = useState(settings.storeId || null);
  const [visitorId, setVisitorId] = useState(getVisitorId());
  const [sessionId, setSessionId] = useState(null);
  const [remoteConfig, setRemoteConfig] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || settings.socketUrl;
    const socket = createSocket(socketUrl, { storeId: settings.storeId });
    socketRef.current = socket;

    setStoreId(settings.storeId || null);

    socket.on("connect", () => {
      console.log("Zanderio Widget: Socket connected, id:", socket.id);

      socket.emit("widget:config:request", { socketId: socket.id });

      socket.emit("identify", {
        storeId: settings.storeId || null,
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

      if (data.visitorId) {
        setVisitorId(data.visitorId);
        persistVisitorId(data.visitorId);
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      if (data.token) {
        setToken(data.token);
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

      if (data.visitorId) {
        setVisitorId(data.visitorId);
        persistVisitorId(data.visitorId);
      }
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      if (data.token) {
        setToken(data.token);
      }
    });

    socket.on("widget:token:refreshed", (response) => {
      const jwt = response?.data?.token || response?.token;
      if (jwt) setToken(jwt);
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
      socket.off("widget:token:refreshed");
      socket.off("widget:config:invalidated");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [settings]);

  return {
    socket: socketRef,
    storeId,
    visitorId,
    sessionId,
    remoteConfig,
    token,
  };
}
