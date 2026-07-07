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

export function normalizeWidgetConfig(raw: unknown): WidgetConfig {
  const c = (raw ?? {}) as Record<string, unknown>;
  const proactive = (c.proactive ?? {}) as Record<string, unknown>;

  return {
    name: str(c.name, "Zanderio"),
    color: str(c.color, tokens.color.primary),
    logoUrl: typeof c.logoUrl === "string" ? c.logoUrl : null,
    welcomeMessage: str(c.welcomeMessage, "Hi there! How can I help?"),
    desktopPosition: c.desktopPosition === "bottom-left" ? "bottom-left" : "bottom-right",
    mobilePosition:
      c.mobilePosition === "bottom-left"
        ? "bottom-left"
        : c.mobilePosition === "bottom-right"
          ? "bottom-right"
          : "bottom-center",
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
