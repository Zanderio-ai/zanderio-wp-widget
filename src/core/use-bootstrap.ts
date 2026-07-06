/**
 * @module core/use-bootstrap
 * @description Run the anonymous bootstrap once and expose its result.
 *
 * Replaces the old `useSocket` lifecycle hook. No persistent connection — a
 * single REST call yields the token + config + conversation id. Re-bootstrap on
 * token expiry is handled lazily by the chat layer (401 → re-run).
 *
 * TODO(widget-overhaul): add silent token refresh when the AI service returns
 * 401 mid-conversation (re-call bootstrap, swap token without losing thread).
 */

import { useEffect, useState } from "react";
import { bootstrapWidget, BootstrapError } from "./bootstrap";
import type { BootstrapResult, WidgetSettings } from "@/config/types";

type Status = "loading" | "ready" | "error";

interface BootstrapState {
  status: Status;
  result: BootstrapResult | null;
  error: BootstrapError | null;
}

export function useBootstrap(settings: WidgetSettings): BootstrapState {
  const [state, setState] = useState<BootstrapState>({
    status: "loading",
    result: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    bootstrapWidget(settings, controller.signal)
      .then((result) => setState({ status: "ready", result, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        const error = err instanceof BootstrapError ? err : new BootstrapError(0);
        setState({ status: "error", result: null, error });
      });

    return () => controller.abort();
  }, [settings]);

  return state;
}
