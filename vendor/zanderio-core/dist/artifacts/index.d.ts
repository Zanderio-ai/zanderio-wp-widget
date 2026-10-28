/**
 * @zanderio/core/artifacts — shared chat-artifact renderers.
 *
 * One implementation of the artifact cards, used by both the embeddable chat
 * widget and the dashboard playground, so the playground shows exactly what a
 * customer sees and a card only ever has to be changed once.
 *
 * IMPORTANT: this door is deliberately absent from the package root
 * (`src/index.ts`). Backend services import `@zanderio/core/models` and must
 * never pull React in transitively. react / react-dom / @emotion/react are
 * OPTIONAL peer dependencies — only apps that import this path need them.
 *
 * Usage:
 *
 *   import { ArtifactCard, CartSheetProvider } from "@zanderio/core/artifacts";
 *
 *   <CartSheetProvider cart={myCartAdapter}>
 *     {messages.map(m => <ArtifactCard artifact={m.data} />)}
 *   </CartSheetProvider>
 *
 * Styling is Emotion CSS-in-JS — no stylesheet to import. Components pick up
 * the nearest <CacheProvider>, which is how the widget keeps its styles inside
 * its shadow root.
 */
export { ArtifactCard } from "./ArtifactCard.js";
export { ActionCard } from "./ActionCard.js";
export { BookingCard } from "./BookingCard.js";
export { CrmCard } from "./CrmCard.js";
export { FallbackCard } from "./FallbackCard.js";
export { InvoiceCard } from "./InvoiceCard.js";
export { OrderCard } from "./OrderCard.js";
export { ComparisonCard } from "./commerce/ComparisonCard.js";
export { DiscoveryCard } from "./commerce/DiscoveryCard.js";
export { RecommendationCard } from "./commerce/RecommendationCard.js";
export { SpotlightCard } from "./commerce/SpotlightCard.js";
export { CartSheetProvider, useCartSheet } from "./commerce/CartSheet.js";
export { Badge, CartButton, CartIconButton, ColourSwatches, OutOfStockVeil, PriceRow, ProductThumb, SaleFlag, TypeLabel, ViewButton, badgeTone, formatPrice, } from "./commerce/shared.js";
export type { BadgeTone } from "./commerce/shared.js";
export { cardShell, cardTitle, headerRow, panel } from "../ui/shell.js";
export { tokens } from "../ui/tokens.js";
export type { Tokens } from "../ui/tokens.js";
export type { Artifact, BookingConfirmation, CommerceItem } from "../chat/types.js";
export type { CartLine, CartPort } from "./types.js";
//# sourceMappingURL=index.d.ts.map