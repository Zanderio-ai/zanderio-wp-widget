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
 * The widget docks to one side of the screen — the same side on desktop and
 * mobile. Anything other than "left" falls back to the default, "right".
 */
function side(value: unknown): WidgetConfig["position"] {
  return typeof value === "string" && value.trim().toLowerCase() === "left" ? "left" : "right";
}

// A backend that predates voice modes sends no `voiceAssistantMode`; its
// enabled widgets are voice-to-text, which is all they could be.
function voiceMode(c: Record<string, unknown>): WidgetConfig["voiceMode"] {
  if (!bool(c.voiceAssistantEnabled, false)) return "off";
  return c.voiceAssistantMode === "voice_to_voice" ? "voice_to_voice" : "voice_to_text";
}

export function normalizeWidgetConfig(raw: unknown): WidgetConfig {
  const c = (raw ?? {}) as Record<string, unknown>;
  const proactive = (c.proactive ?? {}) as Record<string, unknown>;

  return {
    name: str(c.name, "Zanderio"),
    color: str(c.color, tokens.color.primary),
    logoUrl: typeof c.logoUrl === "string" ? c.logoUrl : null,
    welcomeMessage: str(c.welcomeMessage, "Hi there! How can I help?"),
    position: side(c.position),
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
    voiceMode: voiceMode(c),
    imageSearchEnabled: bool(c.imageSearchEnabled, false),
  };
}
