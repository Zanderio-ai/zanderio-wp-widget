/**
 * @module main
 * @description Widget entry point — Shadow DOM mount.
 *
 * Boot sequence:
 *   1. resolveSettings()  — read the public key from the <script data-*> tag.
 *   2. Create/attach a host <div> + open shadow root (style isolation).
 *   3. Install an Emotion cache that injects styles INTO the shadow root, so
 *      `css` from components stays encapsulated (no leakage in or out).
 *   4. Mount <App> onto #zanderio-root inside the shadow tree.
 *
 * Replaces the old Faro init + Socket bootstrap. There is no telemetry SDK.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { resolveSettings } from "@/config/settings";
import App from "./App";

const HOST_ID = "zanderio-widget-host";

function init(): void {
  const settings = resolveSettings();
  if (!settings) return; // no key → nothing to mount

  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    document.body.appendChild(host);
  }
  // The host is `:empty` in the light DOM — all UI lives in the shadow root, which shields what's inside but not the host element itself.
  // So theme rules that hide empty boxes (`div:empty{display:none}`, or less often via visibility/opacity) would collapse the whole widget.
  // Pin all three inline with !important — inline !important beats any theme stylesheet rule — so the widget can't be hidden on any store.
  host.style.setProperty("display", "block", "important");
  host.style.setProperty("visibility", "visible", "important");
  host.style.setProperty("opacity", "1", "important");
  if (host.shadowRoot) return; // already mounted

  const shadow = host.attachShadow({ mode: "open" });

  const root = document.createElement("div");
  root.id = "zanderio-root";
  shadow.appendChild(root);

  // Emotion writes <style> tags into this container instead of document.head.
  const cache = createCache({ key: "z", container: shadow });

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <CacheProvider value={cache}>
        <App settings={settings} />
      </CacheProvider>
    </React.StrictMode>,
  );
}

init();
