/**
 * @module core/config
 * @description Normalize the merchant's widget config into the {@link WidgetConfig}
 * the UI uses.
 *
 * The bootstrap endpoint (`widget.controller.js#toWidgetConfig`) already returns
 * a flat camelCase shape — this layer just applies defaults and tightens types
 * so a never-configured store still renders sensibly.
 */

import type { WidgetConfig } from "@/config/types";
import { tokens } from "@/config/tokens";

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Positions arrive in either of two shapes depending on how the appearance
 * editor saved them: the full corner (`bottom-left`) or just the side
 * (`left`). Accept both — the widget is always bottom-docked, so the side is
 * the only meaningful part. Anything unrecognized falls back.
 */
function corner<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value !== "string") return fallback;
  const side = value.trim().toLowerCase().replace(/_/g, "-");
  const full = (side.startsWith("bottom-") ? side : `bottom-${side}`) as T;
  return allowed.includes(full) ? full : fallback;
}

export function normalizeWidgetConfig(raw: unknown): WidgetConfig {
  const c = (raw ?? {}) as Record<string, unknown>;
  const proactive = (c.proactive ?? {}) as Record<string, unknown>;

  return {
    name: str(c.name, "Zanderio"),
    color: str(c.color, tokens.color.primary),
    logoUrl: typeof c.logoUrl === "string" ? c.logoUrl : null,
    welcomeMessage: str(c.welcomeMessage, "Hi there! How can I help?"),
    desktopPosition: corner(c.desktopPosition, ["bottom-right", "bottom-left"], "bottom-right"),
    mobilePosition: corner(
      c.mobilePosition,
      ["bottom-right", "bottom-left", "bottom-center"],
      "bottom-center",
    ),
    buttonType: typeof c.buttonType === "string" ? c.buttonType : null,
    proactive: {
      enabled: bool(proactive.enabled, false),
      message: str(proactive.message, "Need help finding anything?"),
      delaySeconds: num(proactive.delaySeconds, 15),
      maxPerSession: num(proactive.maxPerSession, 2),
    },
    animation: {
      enabled: bool(c.animationEnabled, true),
      type: str(c.animationType, "wiggle"),
      delaySeconds: num(c.animationDelay, 5),
    },
    autoPopup: bool(c.autoPopup, false),
    voiceAssistantEnabled: bool(c.voiceAssistantEnabled, false),
  };
}
