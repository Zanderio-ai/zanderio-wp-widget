/**
 * @module chat/errors
 * @description Classify a chat stream error into what the visitor is shown.
 *
 * The AI service returns RFC 9457-style JSON bodies for failures, but the AI
 * SDK transport throws the raw response text as the error message. This parses
 * that text (and common network failures) so the UI can show the right status
 * banner and recovery action.
 *
 * The rules are shared; the words are the host's. The defaults speak to a
 * shopper; the dashboard playground passes its own copy for a merchant testing
 * their assistant.
 */

export type ChatErrorKind =
  | "UNAUTHORIZED"
  | "NETWORK"
  | "CONVERSATION_CLOSED"
  | "PHOTO_NOT_SENT"
  | "UNKNOWN";

export interface ChatErrorState {
  kind: ChatErrorKind;
  severity: "error" | "warning" | "info";
  title: string;
  message: string;
}

export type ChatErrorCopy = Partial<Record<ChatErrorKind, { title: string; message: string }>>;

const DEFAULT_COPY: Record<ChatErrorKind, { title: string; message: string }> = {
  UNAUTHORIZED: {
    title: "Session expired",
    message: "Your session timed out. Refresh the page to keep chatting.",
  },
  CONVERSATION_CLOSED: {
    title: "Conversation ended",
    message: "This conversation has ended. Start a new one to keep chatting.",
  },
  NETWORK: {
    title: "Connection issue",
    message: "We couldn't reach the assistant. Check your connection and try again.",
  },
  PHOTO_NOT_SENT: {
    title: "Photo not sent",
    message: "That photo couldn't be sent. Please attach it again.",
  },
  UNKNOWN: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
  },
};

const SEVERITY: Record<ChatErrorKind, ChatErrorState["severity"]> = {
  UNAUTHORIZED: "error",
  CONVERSATION_CLOSED: "info",
  NETWORK: "warning",
  PHOTO_NOT_SENT: "warning",
  UNKNOWN: "error",
};

interface ParsedErrorBody {
  status?: number;
  detail?: string;
  code?: string;
}

function parseErrorBody(raw: string): ParsedErrorBody | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ParsedErrorBody) : null;
  } catch {
    return null;
  }
}

function kindOf(raw: string, parsed: ParsedErrorBody | null): ChatErrorKind {
  const text = raw.toLowerCase();
  const status = parsed?.status;
  if (
    status === 401 ||
    text.includes("authentication required") ||
    text.includes("unauthorized") ||
    parsed?.code === "UNAUTHORIZED"
  ) {
    return "UNAUTHORIZED";
  }
  if (
    text.includes("conversation_closed") ||
    text.includes("conversation has been closed") ||
    parsed?.code === "CONVERSATION_CLOSED"
  ) {
    return "CONVERSATION_CLOSED";
  }
  // The chat turn named a photo the AI service won't use for it — e.g. one
  // checked for another conversation. Photo uploads report their own refusals.
  if (/image_(not_found|wrong_conversation|wrong_store|not_accepted)/.test(text)) {
    return "PHOTO_NOT_SENT";
  }
  if (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network error") ||
    text.includes("connection error") ||
    status === 503 ||
    status === 504
  ) {
    return "NETWORK";
  }
  return "UNKNOWN";
}

export function classifyChatError(error: unknown, copy: ChatErrorCopy = {}): ChatErrorState {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const parsed = parseErrorBody(raw);
  const kind = kindOf(raw, parsed);
  const words = copy[kind] ?? DEFAULT_COPY[kind];
  // An unknown failure shows the service's own explanation when it gave one,
  // unless the host chose fixed words for it.
  const detail = kind === "UNKNOWN" && !copy.UNKNOWN ? parsed?.detail ?? raw : "";
  return { kind, severity: SEVERITY[kind], title: words.title, message: detail || words.message };
}
