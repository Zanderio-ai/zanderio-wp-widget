/**
 * Zanderio Widget — Entry Point
 *
 * Bootstraps the entire widget inside a Shadow DOM attached to a host
 * `<div>` with id `zanderio-widget-host`.
 *
 * Shadow DOM rationale
 * --------------------
 * The widget runs on merchant storefronts whose CSS we do not control.
 * By rendering inside a `mode: "open"` shadow root all widget styles
 * are encapsulated — the host page’s stylesheets cannot leak in, and
 * the widget’s styles cannot leak out.
 *
 * CSS injection
 * -------------
 * Vite’s `?inline` import flag causes the bundler to emit the compiled
 * CSS as a JavaScript string constant.  `injectStyles()` creates a
 * `<style>` element inside the shadow root so all styles live within
 * the encapsulated DOM.
 *
 * Boot sequence
 * -------------
 *   1. `resolveConfig()` reads the host page’s global config object.
 *   2. Find or create a `<div id="zanderio-widget-host">` container.
 *   3. Attach a shadow root (skipped if one already exists).
 *   4. Inject the compiled CSS string as a `<style>` element.
 *   5. Create a `<div id="zanderio-root">` inside the shadow and
 *      mount the React tree onto it via `ReactDOM.createRoot()`.
 *
 * @module main
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { initObservability } from "./config/observability";
import App from "./App";
import { resolveConfig } from "./config/widget.config";
import styles from "./index.css?inline";

initObservability();

const MOUNT_ID = "zanderio-widget-host";

function injectStyles(shadowRoot, css) {
  if (css) {
    const el = document.createElement("style");
    el.textContent = css;
    shadowRoot.appendChild(el);
  }
}

function init() {
  const config = resolveConfig();

  let container = document.getElementById(MOUNT_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = MOUNT_ID;
    document.body.appendChild(container);
  }

  if (!container.shadowRoot) {
    const shadow = container.attachShadow({ mode: "open" });
    injectStyles(shadow, styles);

    const root = document.createElement("div");
    root.id = "zanderio-root";
    shadow.appendChild(root);

    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App settings={config} />
      </React.StrictMode>,
    );
  }
}

init();
