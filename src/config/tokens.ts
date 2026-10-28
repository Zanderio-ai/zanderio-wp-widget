/**
 * @module config/tokens
 * @description Design tokens for the widget.
 *
 * The palette, radii, shadows, and font come from `@zanderio/core/ui` — the same
 * table the artifact cards, the interrupt cards, and the dashboard playground
 * use — so the widget and the dashboard can no longer drift. This file used to
 * be a hand-maintained copy of the dashboard theme with a "keep these in sync on
 * release" note; that sync is gone.
 *
 * Only `z` stays local: host stacking is a widget-shell concern with no meaning
 * inside a card, so it is not part of the shared table.
 */

import { tokens as sharedTokens } from "@zanderio/core/ui";

export const tokens = {
  ...sharedTokens,
  z: { host: 2147483647 },
} as const;

export type Tokens = typeof tokens;
