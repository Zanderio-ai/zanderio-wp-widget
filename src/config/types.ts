/**
 * @module config/types
 * @description Shared domain types for the widget.
 */

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
  desktopPosition: "bottom-right" | "bottom-left";
  mobilePosition: "bottom-right" | "bottom-left" | "bottom-center";
  buttonType: string | null;
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
}

/** Successful response from `POST /api/widget/bootstrap`. */
export interface BootstrapResult {
  storeId: string;
  tenantId: string;
  visitorId: string;
  /** Short-lived JWT for the AI service (sid/tid/vid claims). */
  aiServiceToken: string;
  config: WidgetConfig;
  /** Active conversation/thread id — client-owned UUID, persisted in localStorage. */
  conversationId: string;
}
