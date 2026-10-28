/**
 * @module artifacts/ArtifactCard
 * @description Dispatcher mapping a `data-artifact` payload to its renderer.
 *
 * Cart actions on commerce cards require a {@link CartSheetProvider} ancestor.
 * Without one the buttons render but silently no-op, so mount the provider
 * around whatever renders the message list.
 */

import { memo } from "react";
import type { Artifact } from "../chat/types.js";
import { DiscoveryCard } from "./commerce/DiscoveryCard.js";
import { ComparisonCard } from "./commerce/ComparisonCard.js";
import { RecommendationCard } from "./commerce/RecommendationCard.js";
import { SpotlightCard } from "./commerce/SpotlightCard.js";
import { OrderCard } from "./OrderCard.js";
import { ActionCard } from "./ActionCard.js";
import { BookingCard } from "./BookingCard.js";
import { CrmCard } from "./CrmCard.js";
import { InvoiceCard } from "./InvoiceCard.js";
import { FallbackCard } from "./FallbackCard.js";

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
    case "crm":
      return <CrmCard artifact={data} />;
    case "invoice":
      return <InvoiceCard artifact={data} />;
    default:
      return <FallbackCard artifact={data} />;
  }
});
