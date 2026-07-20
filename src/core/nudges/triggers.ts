/**
 * @module core/nudges/triggers
 * @description Pure-ish trigger detectors, each a small class wrapping timers
 * / storage so `use-nudges.ts` can start/stop them without owning the
 * plumbing. None of these decide whether a nudge is *allowed* — that's
 * always the server's call via `fireNudge`.
 */

const VIEWS_STORAGE_KEY = "zan_nudge_views";

function readJSON<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* private/restricted browsing — non-fatal */
  }
}

/* ── dwell ─────────────────────────────────────────────────────────────── */

/** Fires once `delaySeconds` after mount, regardless of user activity.
 * Used for `inactivity_no_messages`: "visitor has been on the site this
 * long and hasn't sent a chat message" — an actively-browsing shopper
 * must still receive it, so activity must NOT reset this timer. */
export class DwellTrigger {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly delaySeconds: number,
    private readonly onTrip: () => void,
  ) {}

  start(): void {
    this.timer = setTimeout(this.onTrip, Math.max(0, this.delaySeconds) * 1000);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}

/* ── idle ──────────────────────────────────────────────────────────────── */

const ACTIVITY_EVENTS = ["mousemove", "keydown", "scroll", "touchstart"] as const;

/** Fires once `delaySeconds` elapse without user activity. Resets on any
 * activity event or tab visibility change. */
export class IdleTrigger {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onActivity = () => this.reset();
  private readonly onVisibility = () => {
    if (document.visibilityState === "visible") this.reset();
  };

  constructor(
    private readonly delaySeconds: number,
    private readonly onTrip: () => void,
  ) {}

  start(): void {
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, this.onActivity, { passive: true }));
    document.addEventListener("visibilitychange", this.onVisibility);
    this.reset();
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, this.onActivity));
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private reset(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(this.onTrip, Math.max(0, this.delaySeconds) * 1000);
  }
}

/* ── page velocity ─────────────────────────────────────────────────────── */

const LOCATION_CHANGE_EVENT = "zan:locationchange";
let historyPatched = false;

/**
 * `popstate` only fires for browser back/forward — never for
 * `history.pushState()`, which is how virtually every SPA router (React
 * Router, Next.js, Vue Router, ...) performs navigation. Patch `pushState`
 * once (the same trick most analytics scripts use to track SPA page views)
 * and relay both signals through one custom event so a widget mounted once
 * on an SPA still sees every subsequent "page view".
 */
function ensurePageViewSignal(): void {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;

  const emit = () => window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
  const originalPushState = history.pushState.bind(history);

  history.pushState = ((...args: Parameters<History["pushState"]>) => {
    originalPushState(...args);
    emit();
  }) as History["pushState"];

  window.addEventListener("popstate", emit);
}

/** Fires once `viewCount` page views are recorded — within `windowSeconds`
 * when a window is set, or cumulatively across the visit when it's null.
 * A "view" is stamped once at mount (covers full-page-reload storefronts)
 * and again on every subsequent SPA navigation (`pushState` or
 * back/forward). Views live in sessionStorage so the count survives
 * full-page reloads within a visit but resets for a fresh visit — with no
 * window, a localStorage count would accumulate forever and instantly trip
 * for every returning visitor. */
export class PageVelocityTrigger {
  private readonly onLocationChange = () => this.recordView();

  constructor(
    private readonly viewCount: number,
    private readonly windowSeconds: number | null,
    private readonly onTrip: () => void,
  ) {}

  start(): void {
    ensurePageViewSignal();
    window.addEventListener(LOCATION_CHANGE_EVENT, this.onLocationChange);
    this.recordView();
  }

  stop(): void {
    window.removeEventListener(LOCATION_CHANGE_EVENT, this.onLocationChange);
  }

  private recordView(): void {
    const now = Date.now();
    let views = readJSON<number[]>(sessionStorage, VIEWS_STORAGE_KEY, []);
    if (this.windowSeconds != null) {
      const windowMs = Math.max(0, this.windowSeconds) * 1000;
      views = views.filter((t) => now - t <= windowMs);
    }
    views.push(now);
    writeJSON(sessionStorage, VIEWS_STORAGE_KEY, views);

    if (views.length >= this.viewCount) this.onTrip();
  }
}

/* ── cart age ──────────────────────────────────────────────────────────── */

const CART_SINCE_KEY = "zan_nudge_cart_since";
const CART_POLL_MS = 5_000;

/** Fires once an item has sat in cart for `delaySeconds`. Polls
 * `getCartItemCount` periodically since cart mutations usually happen via a
 * full page navigation (add-to-cart), not an in-page event we can listen for. */
export class CartAgeTrigger {
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly delaySeconds: number,
    private readonly getCartItemCount: () => Promise<number | null>,
    private readonly onTrip: () => void,
  ) {}

  start(): void {
    this.tick();
    this.interval = setInterval(() => this.tick(), CART_POLL_MS);
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval);
  }

  private async tick(): Promise<void> {
    const count = await this.getCartItemCount();
    if (count === null) return; // storefront doesn't support cart reads

    if (count <= 0) {
      writeJSON(localStorage, CART_SINCE_KEY, null);
      return;
    }

    let since = readJSON<number | null>(localStorage, CART_SINCE_KEY, null);
    if (since === null) {
      since = Date.now();
      writeJSON(localStorage, CART_SINCE_KEY, since);
    }

    const ageSeconds = (Date.now() - since) / 1000;
    if (ageSeconds >= Math.max(0, this.delaySeconds)) this.onTrip();
  }
}
