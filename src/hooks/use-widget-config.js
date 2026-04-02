/**
 * Zanderio Widget — useWidgetConfig Hook
 *
 * Merges two layers of configuration:
 *
 *   1. **Local** (host page) — values from `resolveConfig()` such as
 *      `primaryColor`, `widgetName`, `widgetIcon`, `welcomeMessage`.
 *   2. **Remote** (backend) — the `widget` / `widgetConfig` payload
 *      delivered via `widget:config:response` or `SESSION_STARTED`
 *      socket events (fields: `name`, `logo_url`, `color`,
 *      `welcome_message`, `desktop_position`, `mobile_position`,
 *      `label_text`, `button_type`).
 *
 * Remote values take precedence so the store owner can change appearance
 * from the Zanderio dashboard without requiring a code redeploy.
 *
 * The hook runs its merge inside a `useEffect` keyed on `remoteConfig`,
 * so it fires exactly once per session (when the socket response arrives).
 *
 * @param {object}      settings     — local widget config from the host page
 * @param {object|null} remoteConfig — appearance config from the backend
 * @returns {{ widgetConfig: object }}
 *
 * @module hooks/use-widget-config
 */

import { useEffect, useMemo } from "react";
import zanderioIcon from "../assets/zanderio-chat-icon.png";

const CONFIG_CACHE_KEY = "zanderio_widget_config";
const CONFIG_TTL_MS = 5 * 60 * 1000; // 5 minutes — config is re-fetched via socket anyway

/**
 * Read cached config from localStorage. Returns `null` if expired or absent.
 */
function readCachedConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CONFIG_TTL_MS) {
      localStorage.removeItem(CONFIG_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(CONFIG_CACHE_KEY);
    return null;
  }
}

/**
 * Persist config with a timestamp so stale entries auto-expire.
 */
function writeCachedConfig(data) {
  try {
    localStorage.setItem(
      CONFIG_CACHE_KEY,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    // Storage full or unavailable — non-critical
  }
}

export function useWidgetConfig(settings, remoteConfig) {
  // Derive widgetConfig synchronously during render — no setState needed.
  // Priority: remoteConfig > localStorage cache > host-page settings > defaults.
  const isConfigReady = !!remoteConfig;

  const widgetConfig = useMemo(() => {
    // When remote arrives it always wins; otherwise fall back to cached, then defaults.
    const source = remoteConfig || readCachedConfig();

    if (source) {
      const proactive = source.messaging?.proactive || source.proactive || {};
      return {
        name:
          source.appearance?.name ||
          source.name ||
          settings.widgetName ||
          "Zanderio",
        icon:
          source.appearance?.logo_url ||
          source.logo_url ||
          source.icon ||
          settings.widgetIcon ||
          zanderioIcon,
        color:
          source.appearance?.color ||
          source.color ||
          settings.primaryColor ||
          settings.themeColor ||
          "#7E3FF2",
        welcomeMessage:
          source.messaging?.welcome_message ||
          source.welcome_message ||
          source.welcomeMessage ||
          settings.welcomeMessage ||
          "Hi there!",
        desktopPosition:
          source.layout?.desktop_position ||
          source.desktop_position ||
          source.desktopPosition ||
          "bottom-right",
        mobilePosition:
          source.layout?.mobile_position ||
          source.mobile_position ||
          source.mobilePosition ||
          "bottom-center",
        labelText:
          source.layout?.label_text || source.label_text || source.labelText,
        buttonType:
          source.layout?.button_type || source.button_type || source.buttonType,
        proactive: {
          enabled: proactive.enabled ?? false,
          message: proactive.message || "Hi! Need help finding anything?",
          delaySeconds: proactive.delay_seconds ?? 15,
          maxPerSession: proactive.max_per_session ?? 2,
        },
      };
    }

    return {
      name: settings.widgetName || "Zanderio",
      icon: settings.widgetIcon || zanderioIcon,
      color: settings.primaryColor || settings.themeColor || "#7E3FF2",
      desktopPosition: "bottom-right",
      mobilePosition: "bottom-center",
      welcomeMessage: settings.welcomeMessage || "Hi there!",
      labelText: undefined,
      buttonType: undefined,
      proactive: {
        enabled: false,
        message: "Hi! Need help finding anything?",
        delaySeconds: 15,
        maxPerSession: 2,
      },
    };
  }, [remoteConfig, settings]);

  // Side-effect only: persist to localStorage when remote config arrives.
  useEffect(() => {
    if (!remoteConfig) return;
    writeCachedConfig(widgetConfig);
  }, [remoteConfig, widgetConfig]);

  return { widgetConfig, isConfigReady };
}
