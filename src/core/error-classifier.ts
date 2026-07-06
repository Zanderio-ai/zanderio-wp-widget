/**
 * @module core/error-classifier
 * @description Classifies storefront chat errors into user-facing categories.
 *
 * The AI service returns RFC 9457-style JSON bodies for failures, but the AI SDK
 * transport throws the raw response text as the error message. This parses that
 * text (and common network failures) so the UI can show the right status banner
 * and recovery action. Storefront twin of client/app
 * `playground/utils/error-classifier.ts` — same kinds, visitor-facing copy.
 */

export type WidgetErrorKind = "UNAUTHORIZED" | "NETWORK" | "CONVERSATION_CLOSED" | "UNKNOWN";

export interface WidgetErrorState {
  kind: WidgetErrorKind;
  severity: "error" | "warning" | "info";
  title: string;
  message: string;
}

interface ParsedErrorBody {
  status?: number;
  detail?: string;
  code?: string;
}

function parseErrorBody(raw: string): ParsedErrorBody | null {
  try {
    return JSON.parse(raw) as ParsedErrorBody;
  } catch {
    return null;
  }
}

export function classifyWidgetError(error: unknown): WidgetErrorState {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const text = raw.toLowerCase();

  const parsed = parseErrorBody(raw);
  const status = parsed?.status;
  const detail = parsed?.detail ?? raw;

  if (
    status === 401 ||
    text.includes("authentication required") ||
    text.includes("unauthorized") ||
    parsed?.code === "UNAUTHORIZED"
  ) {
    return {
      kind: "UNAUTHORIZED",
      severity: "error",
      title: "Session expired",
      message: "Your session timed out. Refresh the page to keep chatting.",
    };
  }

  if (
    text.includes("conversation_closed") ||
    text.includes("conversation has been closed") ||
    parsed?.code === "CONVERSATION_CLOSED"
  ) {
    return {
      kind: "CONVERSATION_CLOSED",
      severity: "info",
      title: "Conversation ended",
      message: "This conversation has ended. Start a new one to keep chatting.",
    };
  }

  if (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network error") ||
    text.includes("connection error") ||
    status === 503 ||
    status === 504
  ) {
    return {
      kind: "NETWORK",
      severity: "warning",
      title: "Connection issue",
      message: "We couldn't reach the assistant. Check your connection and try again.",
    };
  }

  return {
    kind: "UNKNOWN",
    severity: "error",
    title: "Something went wrong",
    message: detail || "An unexpected error occurred. Please try again.",
  };
}
