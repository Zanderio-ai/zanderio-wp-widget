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
 * @param {{ storeId: string, shopperId: string }} params
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export function getConversations(client, { storeId, shopperId }) {
  return client.get("/stores/widget/conversations", {
    params: { storeId, shopperId },
  });
}
