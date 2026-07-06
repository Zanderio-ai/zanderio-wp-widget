/**
 * @module config/env
 * @description Compile-time backend URLs, baked by Vite `define`.
 *
 * The widget ships with no runtime configuration of URLs — each build target
 * (dev/prod) hard-codes the API + AI endpoints. The merchant only supplies a
 * public key via the script tag.
 */

export const env = {
  /** Platform REST API (widget bootstrap, install info). */
  API_URL: import.meta.env.VITE_API_BASE_URL,
  /** AI service (LangGraph threads — chat stream + state). */
  AI_URL: import.meta.env.VITE_AI_URL,
  /** Build version, surfaced in request headers for debugging. */
  VERSION: __WIDGET_VERSION__,
} as const;
