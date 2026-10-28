/**
 * @module chat-ui/form
 * @description Form control styles shared by the interrupt (HITL) cards, so the
 * booking form and the lead form cannot drift apart visually.
 */
export declare const title: import("@emotion/react").SerializedStyles;
export declare const subtitle: import("@emotion/react").SerializedStyles;
export declare const fieldLabel: import("@emotion/react").SerializedStyles;
export declare const input: import("@emotion/react").SerializedStyles;
export declare const fieldGroup: import("@emotion/react").SerializedStyles;
export declare const summaryLine: import("@emotion/react").SerializedStyles;
export declare const actionsRow: import("@emotion/react").SerializedStyles;
export declare const spacer: import("@emotion/react").SerializedStyles;
export declare const ghostButton: import("@emotion/react").SerializedStyles;
export declare const confirmButton: (brandColor: string) => import("@emotion/react").SerializedStyles;
/**
 * Pill used for day tabs and choice chips.
 *
 * Takes `brandColor` as a value rather than reading `--z-primary`, because the
 * selected state needs an alpha tint (`${brandColor}0F`) and you cannot append
 * hex alpha to a `var()` reference.
 */
export declare const pill: (selected: boolean, brandColor: string) => import("@emotion/react").SerializedStyles;
//# sourceMappingURL=form.d.ts.map