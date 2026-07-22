/**
 * @module core/nudges/use-nudges
 * @description Orchestrates the proactive nudge triggers delivered at
 * bootstrap. The widget only owns trigger *timing*; every fire still round-
 * trips through Platform (`fireNudge`), which owns the actual on/off
 * decision (settings, integration gate, cooldown).
 *
 * The inactivity/booking nudges are deliberately different clocks:
 *   - `inactivity_no_messages` — DWELL: fires after N seconds on the site
 *     with zero chat messages sent, even while the shopper actively
 *     browses (activity must not reset it, or an engaged browser would
 *     never see it).
 *   - `inactivity_has_messages` — IDLE: the shopper chatted, then went
 *     quiet; resets on any page activity.
 *   - `booking` — DWELL, armed only while the chat is CLOSED with an
 *     abandoned booking in the conversation (link shown / flow paused,
 *     not confirmed). Its delay is shorter than has-messages so it wins
 *     the race: "finish your booking?" first, generic "anything else?"
 *     later.
 * Message count is checked at trip time (live via ref), so a history
 * hydration that lands mid-timer flips the variant correctly.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fireNudge } from "./fire";
import { DwellTrigger, IdleTrigger, PageVelocityTrigger, CartAgeTrigger } from "./triggers";
import { getCartAdapter } from "@/platform/cart";
import type { Storefront } from "@/config/types";
import type { Nudge } from "./types";

const SHOWN_KEY_PREFIX = "zan_nudge_shown:";

// A denied fire (server cooldown, gated off, network hiccup) must NOT burn
// the nudge for the whole session — only an actually-displayed bubble does.
// This throttle just keeps re-tripping triggers (e.g. the cart poll) from
// spamming the fire endpoint between attempts.
const RETRY_INTERVAL_MS = 60_000;

function alreadyShown(key: string): boolean {
  try {
    return sessionStorage.getItem(SHOWN_KEY_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function markShown(key: string): void {
  try {
    sessionStorage.setItem(SHOWN_KEY_PREFIX + key, "1");
  } catch {
    /* private/restricted browsing — non-fatal, may re-attempt this session */
  }
}

export interface ActiveNudge {
  key: string;
  message: string;
  clickPrompt: string;
}

interface UseNudgesArgs {
  nudges: Nudge[];
  storeId: string | null;
  shopperId: string | null;
  conversationId: string | null;
  storefront: Storefront;
  isOpen: boolean;
  messageCount: number;
  /** Abandoned booking in the conversation — see core/nudges/booking-context. */
  hasBookingContext: boolean;
}

export function useNudges({
  nudges,
  storeId,
  shopperId,
  conversationId,
  storefront,
  isOpen,
  messageCount,
  hasBookingContext,
}: UseNudgesArgs) {
  const [activeNudge, setActiveNudge] = useState<ActiveNudge | null>(null);

  const isOpenRef = useRef(isOpen);
  const messageCountRef = useRef(messageCount);
  const activeNudgeRef = useRef<ActiveNudge | null>(null);
  // conversationId starts null and is set moments after mount (App.tsx
  // resolves it from bootstrap in its own effect) — read it live via a ref
  // rather than depending on it below, so that settling doesn't tear down
  // and restart every trigger (and double-record the initial page view)
  // right after mount.
  const conversationIdRef = useRef(conversationId);
  const lastAttemptAtRef = useRef(new Map<string, number>());
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);
  useEffect(() => {
    messageCountRef.current = messageCount;
  }, [messageCount]);
  useEffect(() => {
    activeNudgeRef.current = activeNudge;
  }, [activeNudge]);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    if (isOpen) setActiveNudge(null);
  }, [isOpen]);

  const attemptFire = useCallback(
    async (nudge: Nudge) => {
      if (!storeId || !shopperId) return;
      if (isOpenRef.current || activeNudgeRef.current) return;
      if (alreadyShown(nudge.key)) return;

      const last = lastAttemptAtRef.current.get(nudge.key) ?? 0;
      if (Date.now() - last < RETRY_INTERVAL_MS) return;
      lastAttemptAtRef.current.set(nudge.key, Date.now());

      const result = await fireNudge({
        storeId,
        shopperId,
        key: nudge.key,
        conversationId: conversationIdRef.current,
      });

      if (result.allow) {
        markShown(nudge.key);
        setActiveNudge({
          key: nudge.key,
          message: result.message ?? nudge.message ?? "",
          clickPrompt: result.clickPrompt ?? nudge.clickPrompt,
        });
      } else {
        // Dev builds keep console (terser drops it in prod only) — this is
        // the difference between "broken" and "server said cooldown" when
        // testing on a storefront.
        console.debug(`[zanderio] nudge "${nudge.key}" not shown:`, result.reason ?? "denied");
      }
    },
    [storeId, shopperId],
  );

  useEffect(() => {
    if (!storeId || !shopperId || nudges.length === 0) return;

    const byKey = new Map(nudges.map((n) => [n.key, n]));
    const stops: Array<() => void> = [];

    // Dwell: on-site N seconds with no chat message sent. Does not reset on
    // activity — an actively-browsing shopper still gets it.
    const inactivityNoMsg = byKey.get("inactivity_no_messages");
    if (inactivityNoMsg?.trigger.delaySeconds != null) {
      const dwell = new DwellTrigger(inactivityNoMsg.trigger.delaySeconds, () => {
        if (messageCountRef.current === 0) void attemptFire(inactivityNoMsg);
      });
      dwell.start();
      stops.push(() => dwell.stop());
    }

    // Idle: shopper chatted, then went quiet. Resets on page activity.
    const inactivityHasMsg = byKey.get("inactivity_has_messages");
    if (inactivityHasMsg?.trigger.delaySeconds != null) {
      const idle = new IdleTrigger(inactivityHasMsg.trigger.delaySeconds, () => {
        if (messageCountRef.current > 0) void attemptFire(inactivityHasMsg);
      });
      idle.start();
      stops.push(() => idle.stop());
    }

    // windowSeconds is optional: null means "N pages this visit, no time
    // limit" rather than "N pages within the window".
    const searching = nudges.find((n) => n.trigger.type === "page_velocity");
    if (searching?.trigger.viewCount != null) {
      const velocity = new PageVelocityTrigger(
        searching.trigger.viewCount,
        searching.trigger.windowSeconds,
        () => {
          if (messageCountRef.current === 0) void attemptFire(searching);
        },
      );
      velocity.start();
      stops.push(() => velocity.stop());
    }

    const cart = nudges.find((n) => n.trigger.type === "cart_age");
    if (cart?.trigger.delaySeconds != null) {
      const adapter = getCartAdapter(storefront);
      const cartAge = new CartAgeTrigger(
        cart.trigger.delaySeconds,
        async () => {
          const snapshot = await adapter.getCart();
          return snapshot ? snapshot.itemCount : null;
        },
        () => void attemptFire(cart),
      );
      cartAge.start();
      stops.push(() => cartAge.stop());
    }

    return () => stops.forEach((stop) => stop());
    // Triggers are (re)built only when the eligible nudge set or identity
    // changes — not on every isOpen/messageCount/conversationId tick, which
    // are read live via refs instead so timers aren't torn down and
    // restarted constantly (or immediately after mount, once, when
    // conversationId settles).
  }, [nudges, storeId, shopperId, storefront, attemptFire]);

  // Booking: armed only while the chat is CLOSED with an abandoned booking
  // in the conversation. Deliberately dependent on isOpen/hasBookingContext
  // (unlike the triggers above) — closing the chat is exactly the moment
  // the countdown should start, and reopening it must cancel the timer.
  //
  // The dwell RE-ARMS after each attempt: a single denied fire (server
  // cooldown mid-expiry, another bubble on screen at trip time, a network
  // blip) must not kill the nudge for the whole closed-chat period the way
  // a one-shot timer would. attemptFire's own throttle caps actual POSTs
  // to one a minute, and a shown bubble stops the loop via alreadyShown.
  useEffect(() => {
    const booking = nudges.find((n) => n.key === "booking");
    if (!booking || booking.trigger.delaySeconds == null) return;
    if (isOpen || !hasBookingContext) return;
    if (alreadyShown(booking.key)) return;

    let dwell: DwellTrigger | null = null;
    let disposed = false;

    const arm = () => {
      if (disposed) return;
      dwell = new DwellTrigger(booking.trigger.delaySeconds!, () => {
        void attemptFire(booking).finally(() => {
          if (!alreadyShown(booking.key)) arm();
        });
      });
      dwell.start();
    };
    arm();

    return () => {
      disposed = true;
      dwell?.stop();
    };
  }, [nudges, isOpen, hasBookingContext, attemptFire]);

  const dismiss = () => setActiveNudge(null);

  return { activeNudge, dismiss };
}
