/**
 * @module artifacts/ArtifactCard
 * @description Dispatcher mapping a `data-artifact` payload to its renderer.
 *
 * Cart actions on commerce cards require a {@link CartSheetProvider} ancestor.
 * Without one the buttons render but silently no-op, so mount the provider
 * around whatever renders the message list.
 */
export declare const ArtifactCard: import("react").MemoExoticComponent<({ artifact }: {
    artifact: unknown;
}) => import("@emotion/react/jsx-runtime").JSX.Element | null>;
//# sourceMappingURL=ArtifactCard.d.ts.map