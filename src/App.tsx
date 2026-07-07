/**
 * @module App
 * @description Composition layer — wires bootstrap + chat into the chat shell.
 *
 * Zero business logic: bootstrap yields token/config/conversation; the chat hook
 * yields the live message stream; this component injects the brand-aware global
 * stylesheet and renders the launcher, proactive nudge, and chat window.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Global, css } from "@emotion/react";
import { useBootstrap } from "@/core/use-bootstrap";
import { useWidgetChat } from "@/core/use-widget-chat";
import { newConversationId } from "@/core/bootstrap";
import { useNudges } from "@/core/nudges/use-nudges";
import { useResponsive } from "@/hooks/use-responsive";
import { detectStorefront } from "@/platform/detect";
import { globalStyles } from "@/ui/styles";
import { Launcher } from "@/ui/Launcher";
import { ProactiveBubble } from "@/ui/ProactiveBubble";
import { NudgeBubble } from "@/ui/NudgeBubble";
import { ChatWindow } from "@/ui/ChatWindow";
import type { WidgetSettings } from "@/config/types";

export default function App({ settings }: { settings: WidgetSettings }) {
  const { status, result } = useBootstrap(settings);
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);

  // Conversation id starts from bootstrap; "start new chat" replaces it,
  // which re-keys the chat hook and loads a fresh (empty) thread.
  const [conversationId, setConversationId] = useState<string | null>(null);
  useEffect(() => {
    if (result?.conversationId) setConversationId(result.conversationId);
  }, [result?.conversationId]);

  const chat = useWidgetChat({
    conversationId,
    token: result?.aiServiceToken ?? null,
  });

  const storefront = useMemo(() => detectStorefront(settings.platform), [settings.platform]);
  const userMessageCount = useMemo(
    () => chat.messages.filter((m) => m.role === "user").length,
    [chat.messages],
  );
  const nudgeEngine = useNudges({
    nudges: result?.nudges ?? [],
    storeId: result?.storeId ?? null,
    shopperId: result?.visitorId ?? null,
    conversationId,
    storefront,
    isOpen,
    messageCount: userMessageCount,
  });

  const openFromNudge = useCallback(() => {
    if (nudgeEngine.activeNudge) chat.send(nudgeEngine.activeNudge.clickPrompt);
    nudgeEngine.dismiss();
    setIsOpen(true);
  }, [chat, nudgeEngine]);

  // Backend signals a closed conversation → visitor can start a fresh one.
  // newConversationId persists the new UUID so the next page load resumes it.
  const startNewChat = useCallback(() => {
    chat.stop();
    setConversationId(newConversationId(settings.key));
  }, [chat, settings.key]);

  const config = result?.config;
  const brandColor = config?.color ?? "#7E3FF2";
  const position = isMobile ? config?.mobilePosition : config?.desktopPosition;

  // Merchant can opt the chat window to open itself once, unprompted.
  // Mirrors the dashboard widget-appearance preview: with the attention
  // animation on, wait for it to play before popping open; with it off,
  // open immediately.
  useEffect(() => {
    if (!config?.autoPopup || isOpen) return;
    const delayMs = config.animation.enabled ? Math.max(0, config.animation.delaySeconds) * 1000 : 0;
    const timer = setTimeout(() => setIsOpen(true), delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.autoPopup, config?.animation.enabled, config?.animation.delaySeconds]);

  // On hard bootstrap failure (inactive/over-quota/not-found) render nothing —
  // the widget simply never appears on the host page.
  if (status === "error") return null;

  return (
    <>
      <Global styles={css(globalStyles(brandColor))} />

      {config && (
        <ChatWindow
          isOpen={isOpen}
          isMobile={isMobile}
          config={config}
          brandColor={brandColor}
          chat={chat}
          onClose={() => setIsOpen(false)}
          onStartNewChat={startNewChat}
        />
      )}

      {config && nudgeEngine.activeNudge && !isOpen && (
        <NudgeBubble
          message={nudgeEngine.activeNudge.message}
          name={config.name}
          brandColor={brandColor}
          position={position}
          onOpen={openFromNudge}
          onDismiss={nudgeEngine.dismiss}
        />
      )}

      {config && (
        <ProactiveBubble
          config={config}
          brandColor={brandColor}
          isOpen={isOpen}
          suppressed={Boolean(nudgeEngine.activeNudge)}
          position={position}
          onOpen={() => setIsOpen(true)}
        />
      )}

      <Launcher
        isOpen={isOpen}
        isLoading={status === "loading"}
        isMobile={isMobile}
        brandColor={brandColor}
        logoUrl={config?.logoUrl}
        animation={config?.animation}
        position={position}
        onToggle={() => setIsOpen((v) => !v)}
      />
    </>
  );
}
