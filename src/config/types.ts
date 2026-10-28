/**
 * @module config/types
 * @description Shared domain types for the widget.
 */

import type { Nudge } from "@/core/nudges/types";

/** Storefront platform the widget is embedded on. */
export type Storefront = "shopify" | "woocommerce" | "custom" | "unknown";

/**
 * Host-page settings, resolved from the `<script data-*>` attributes or the
 * legacy `window.ZanderioWidgetConfig` global. The only required field is the
 * public widget key; everything else is optional override.
 *
 * @see resolveSettings
 */
export interface WidgetSettings {
  /** Opaque per-store public key (`pk_...`). Resolves to store+tenant at bootstrap. */
  key: string;
  /** Optional explicit platform hint; otherwise auto-detected at runtime. */
  platform?: Storefront;
  /** Host origin, captured for analytics/abuse-reduction (not security). */
  origin: string;
}

/**
 * Merchant-controlled appearance + behavior, delivered by the backend in the
 * bootstrap response (`StoreWidget.config`). Mirrors the client/app
 * widget-appearance editor. Snake_case is the wire shape; we normalize on read.
 *
 * @see normalizeWidgetConfig
 */
export interface WidgetConfig {
  name: string;
  color: string;
  logoUrl: string | null;
  welcomeMessage: string;
  /** Side the launcher, panel and bubbles dock to — bottom corner, on every screen size. */
  position: "left" | "right";
  proactive: {
    enabled: boolean;
    message: string;
    delaySeconds: number;
    maxPerSession: number;
  };
  animation: {
    enabled: boolean;
    type: string;
    delaySeconds: number;
  };
  autoPopup: boolean;
  /** Merchant kill-switch for the mic/voice-input button. */
  voiceAssistantEnabled: boolean;
  /**
   * Which voice feature the mic drives — only ever one. "voice_to_text" types
   * the visitor's words into a normal text turn; "voice_to_voice" sends the
   * recording as a voice message and the assistant answers with one.
   */
  voiceMode: VoiceMode;
  /** Merchant toggle for the photo button — visitors search the catalog with a product photo. */
  imageSearchEnabled: boolean;
}

export type VoiceMode = "off" | "voice_to_text" | "voice_to_voice";

/** Successful response from `POST /v1/widget/bootstrap`. */
export interface BootstrapResult {
  storeId: string;
  tenantId: string;
  visitorId: string;
  /** Short-lived JWT for the AI service (sid/tid/vid claims). */
  aiServiceToken: string;
  config: WidgetConfig;
  /** Active conversation/thread id — client-owned UUID, persisted in localStorage. */
  conversationId: string;
  /** Proactive nudges eligible for this store (see core/nudges). */
  nudges: Nudge[];
  /**
   * Auto-generated starter questions about this store, shown as tappable chips
   * before the visitor's first message. Empty when the merchant has the
   * "Show suggested questions" widget toggle off (server decides).
   */
  suggestedQuestions: string[];
}
