/**
 * @module core/bootstrap
 * @description Anonymous widget bootstrap over REST (no websocket).
 *
 * Exchanges the per-store widget key (`data-id`) for a scoped AI-service JWT
 * and the merchant's appearance config.
 *
 * ── Storage strategy ────────────────────────────────────────────────────────
 *
 * Two values are persisted to localStorage, both scoped to the widget key so
 * multiple Zanderio-powered stores in the same browser never collide:
 *
 *   zan_vid_{key}   visitor id   — anonymous identity that survives reloads
 *                                  and return visits; sent back to bootstrap
 *                                  so the AI service maintains visitor context.
 *
 *   zan_cid_{key}   conversation id — UUID of the active thread; persisted so
 *                                  history is resumed on reload via
 *                                  GET /v1/threads/{id}/state. A missing or
 *                                  cleared value gets a fresh UUID on next boot.
 *
 * Naming convention rationale:
 *   - Prefix `zan_`    — product namespace; prevents collision with host-page
 *                        keys. Short (3 chars) to keep keys readable.
 *                        (Intercom: `intercom-id-{appId}`, Drift: `driftt_aid`,
 *                        Tidio: `lyro_conversation_id` — all prefix-scoped.)
 *   - Snake_case       — consistent JS convention; avoids URL-encoding issues
 *                        that hyphens cause in some storage inspection tools.
 *   - Scoped by key    — widget key (`wdg_...`) is the page-level identity,
 *                        available before bootstrap completes. Using store_id
 *                        would require a bootstrap round-trip before we could
 *                        even read a prior conversationId.
 *
 * ── Bootstrap contract ──────────────────────────────────────────────────────
 *   req:  POST /v1/widget/bootstrap  { key, visitor_id? }
 *   res:  { storeId, tenantId, visitorId, aiServiceToken, config }
 *
 * ConversationId is fully client-owned — the AI service keys LangGraph
 * checkpoints on the UUID, so "start new chat" is just a new UUID.
 */

import { env } from "@/config/env";
import { normalizeWidgetConfig } from "./config";
import type { BootstrapResult, WidgetSettings } from "@/config/types";

const PREFIX = "zan";

const keys = {
  vid: (widgetKey: string) => `${PREFIX}_vid_${widgetKey}`,
  cid: (widgetKey: string) => `${PREFIX}_cid_${widgetKey}`,
};

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private/restricted browsing — non-fatal; values regenerate next load */
  }
}

/** Mint a fresh conversation UUID and persist it for the next page load. */
export function newConversationId(widgetKey: string): string {
  const id = crypto.randomUUID();
  lsSet(keys.cid(widgetKey), id);
  return id;
}

export async function bootstrapWidget(
  settings: WidgetSettings,
  signal?: AbortSignal,
): Promise<BootstrapResult> {
  const response = await fetch(`${env.API_URL}/v1/widget/bootstrap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: settings.key,
      visitor_id: lsGet(keys.vid(settings.key)) ?? undefined,
    }),
    signal,
  });

  if (!response.ok) {
    throw new BootstrapError(response.status);
  }

  const data = (await response.json()) as Record<string, unknown>;

  const storeId = String(data.storeId ?? "");
  const tenantId = String(data.tenantId ?? "");
  const visitorId = String(data.visitorId ?? "");

  if (visitorId) lsSet(keys.vid(settings.key), visitorId);

  // Reuse existing conversationId so history survives a page reload.
  // A missing or blank value gets a fresh UUID (first visit / cleared storage).
  const existingCid = lsGet(keys.cid(settings.key));
  const conversationId = existingCid || crypto.randomUUID();
  if (!existingCid) lsSet(keys.cid(settings.key), conversationId);

  return {
    storeId,
    tenantId,
    visitorId,
    aiServiceToken: String(data.aiServiceToken ?? ""),
    config: normalizeWidgetConfig(data.config),
    conversationId,
  };
}

/** Maps bootstrap HTTP failures to a stable, user-facing reason code. */
export class BootstrapError extends Error {
  readonly status: number;
  readonly reason: "inactive" | "not_found" | "unknown";

  constructor(status: number) {
    super(`Widget bootstrap failed (${status})`);
    this.name = "BootstrapError";
    this.status = status;
    this.reason =
      status === 403
        ? "inactive"
        : status === 404
          ? "not_found"
          : "unknown";
  }
}
