/**
 * @module core/nudges/types
 * @description Wire + normalized shapes for the proactive nudge system.
 *
 * Mirrors Platform's `nudge_definitions` catalog (see
 * Zanderio-Backend-Platform `src/database/models/nudge-definition.model.js`).
 * Bootstrap returns only the nudges eligible for this store — the widget
 * never decides *whether* a nudge is allowed, only *when to ask* by timing
 * these triggers and calling `POST /v1/widget/nudges/fire`.
 */

export type NudgeType = "static" | "ai";
export type TriggerType = "idle" | "page_velocity" | "cart_age";

export interface NudgeTrigger {
  type: TriggerType;
  delaySeconds: number | null;
  viewCount: number | null;
  windowSeconds: number | null;
}

export interface Nudge {
  key: string;
  type: NudgeType;
  trigger: NudgeTrigger;
  /** Static text (null for the AI-composed booking nudge). */
  message: string | null;
  clickPrompt: string;
}

/** Response from `POST /v1/widget/nudges/fire`. */
export interface FireNudgeResult {
  allow: boolean;
  message?: string;
  clickPrompt?: string;
  reason?: string;
}

function normalizeTrigger(raw: unknown): NudgeTrigger {
  const t = (raw ?? {}) as Record<string, unknown>;
  const type = t.type === "page_velocity" || t.type === "cart_age" ? t.type : "idle";
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    type,
    delaySeconds: num(t.delay_seconds),
    viewCount: num(t.view_count),
    windowSeconds: num(t.window_seconds),
  };
}

/** Normalize the raw `nudges[]` array from the bootstrap response. */
export function normalizeNudges(raw: unknown): Nudge[] {
  if (!Array.isArray(raw)) return [];

  const nudges: Nudge[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const n = entry as Record<string, unknown>;
    if (typeof n.key !== "string" || typeof n.click_prompt !== "string") continue;

    nudges.push({
      key: n.key,
      type: n.type === "ai" ? "ai" : "static",
      trigger: normalizeTrigger(n.trigger),
      message: typeof n.message === "string" ? n.message : null,
      clickPrompt: n.click_prompt,
    });
  }
  return nudges;
}
