/**
 * Zanderio Widget — Browser Observability (Grafana Faro)
 *
 * Initialises Grafana Faro for Real-User Monitoring (RUM) in the widget.
 * Captures web-vitals, JS errors, console errors, and distributed traces
 * that correlate with the backend OTel spans via W3C `traceparent`.
 *
 * The collector URL is baked in at build time via Vite `define`.
 * When the URL is absent (local dev without Grafana Cloud) Faro is
 * silently skipped — the widget works normally without telemetry.
 *
 * @module config/observability
 */

import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

const FARO_COLLECTOR_URL = import.meta.env.VITE_FARO_COLLECTOR_URL || "";

let faro = null;

/**
 * Boot Faro once.  Safe to call multiple times — subsequent calls are no-ops.
 *
 * @param {{ environment?: string }} [opts]
 * @returns {import("@grafana/faro-web-sdk").Faro | null}
 */
export function initObservability(opts = {}) {
  if (faro) return faro;
  if (!FARO_COLLECTOR_URL) return null;

  const environment = opts.environment || import.meta.env.MODE || "production";

  faro = initializeFaro({
    url: FARO_COLLECTOR_URL,
    app: {
      name: "widget",
      version: __WIDGET_VERSION__,
      environment,
      namespace: "zanderio",
    },

    instrumentations: [
      ...getWebInstrumentations({
        captureConsole: environment !== "production",
      }),
      new TracingInstrumentation({
        instrumentationOptions: {
          propagateTraceHeaderCorsUrls: [/zanderio\.ai/],
        },
      }),
    ],
  });

  return faro;
}
