/**
 * @module artifacts/ArtifactCard
 * @description Dispatcher mapping a `data-artifact` payload to its renderer.
 * Type set mirrors client/app `artifacts/ArtifactCard.tsx`, restyled with tokens
 * (no MUI). Cart actions on commerce cards require a {@link CartSheetProvider}
 * ancestor (mounted in ChatWindow).
 */

import { memo } from "react";
import type { Artifact } from "@/core/chat-types";
import { DiscoveryCard } from "./commerce/DiscoveryCard";
import { ComparisonCard } from "./commerce/ComparisonCard";
import { RecommendationCard } from "./commerce/RecommendationCard";
import { SpotlightCard } from "./commerce/SpotlightCard";
import { OrderCard } from "./OrderCard";
import { ActionCard } from "./ActionCard";
import { BookingCard } from "./BookingCard";
import { InvoiceCard } from "./InvoiceCard";
import { FallbackCard } from "./FallbackCard";

export const ArtifactCard = memo(function ArtifactCard({ artifact }: { artifact: unknown }) {
  const data = artifact as Artifact | null;
  if (!data?.type) return null;

  switch (data.type) {
    case "discovery":
      return <DiscoveryCard artifact={data} />;
    case "comparison":
      return <ComparisonCard artifact={data} />;
    case "recommendation":
      return <RecommendationCard artifact={data} />;
    case "spotlight":
      return <SpotlightCard artifact={data} />;
    case "order":
      return <OrderCard artifact={data} />;
    case "action":
      return <ActionCard artifact={data} />;
    case "booking":
      return <BookingCard artifact={data} />;
    case "invoice":
      return <InvoiceCard artifact={data} />;
    default:
      return <FallbackCard artifact={data} />;
  }
});
