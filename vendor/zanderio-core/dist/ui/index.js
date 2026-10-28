/**
 * @zanderio/core/ui — the design foundation for every shared chat surface.
 *
 * Tokens and card chrome, with no domain knowledge: nothing in here knows what
 * an artifact or an interrupt is. Both `@zanderio/core/artifacts` and
 * `@zanderio/core/chat-ui` build on it, which is why it is its own layer —
 * `panel` is used by five artifact cards and three interrupt cards, so it never
 * belonged to either of them.
 *
 * `tokens` is the single source of truth for chat styling. The widget applies it
 * as CSS custom properties on its shadow root; the dashboard derives its MUI
 * palette from it rather than keeping a parallel copy.
 */
export { tokens } from "./tokens.js";
export { panel, cardShell, headerRow, cardTitle } from "./shell.js";
//# sourceMappingURL=index.js.map