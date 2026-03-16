/**
 * Zanderio Widget - API Service
 *
 * Thin Axios wrapper for communicating with the Zanderio REST backend.
 *
 * Endpoints:
 *   POST /stores/widget/chat  - send a chat message (200 sync or 202 async)
 *   GET  /stores/widget/conversations - load conversation history
 *
 * @module services/api.service
 */

import axios from "axios";

/**
 * @param {string} baseURL
 * @returns {import("axios").AxiosInstance}
 */
export function createApiClient(baseURL) {
  const client = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });

  // Cache-busting interceptor: append a `_t` timestamp to every GET request
  // to force the browser to bypass disk-cached responses.
  client.interceptors.request.use((config) => {
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
      // Also set request-level headers to signal "no cache"
      config.headers["Cache-Control"] = "no-cache";
      config.headers["Pragma"] = "no-cache";
    }
    return config;
  });

  return client;
}

/**
 * @param {import("axios").AxiosInstance} client
 * @param {{ storeId: string, message: string, shopperId: string, socketId: string, sessionId: string }} payload
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export function sendChatMessage(
  client,
  { storeId, message, shopperId, socketId, sessionId },
) {
  return client.post("/stores/widget/chat", {
    storeId,
    message,
    shopperId,
    socketId,
    sessionId,
    pageUrl: window.location.href,
    pageTitle: document.title,
  });
}

/**
 * @param {import("axios").AxiosInstance} client
 * @param {{ storeId: string, shopperId: string }} params
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export function getConversations(client, { storeId, shopperId }) {
  return client.get("/stores/widget/conversations", {
    params: { storeId, shopperId },
  });
}
