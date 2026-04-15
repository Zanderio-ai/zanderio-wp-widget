/**
 * Zanderio Widget - API Service
 *
 * Thin Axios wrapper for communicating with the Zanderio REST backend.
 *
 * Endpoints:
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

  client.interceptors.request.use((config) => {
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
      config.headers["Cache-Control"] = "no-cache";
      config.headers["Pragma"] = "no-cache";
    }
    return config;
  });

  return client;
}

/**
 * @param {import("axios").AxiosInstance} client
 * @param {{ storeId: string, visitorId: string }} params
 * @param {import("axios").AxiosRequestConfig} [requestConfig]
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export function getConversations(
  client,
  { storeId, visitorId },
  requestConfig = {},
) {
  return client.get("/stores/widget/conversations", {
    ...requestConfig,
    params: { storeId, visitorId },
  });
}

/**
 * @param {import("axios").AxiosInstance} client
 * @param {{ conversationId: string, page?: number, limit?: number, order?: "asc"|"desc" }} params
 * @param {import("axios").AxiosRequestConfig} [requestConfig]
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export function getConversationMessages(
  client,
  { conversationId, page = 1, limit = 50, order = "asc" },
  requestConfig = {},
) {
  return client.get(`/stores/widget/conversations/${conversationId}/messages`, {
    ...requestConfig,
    params: { page, limit, order },
  });
}
