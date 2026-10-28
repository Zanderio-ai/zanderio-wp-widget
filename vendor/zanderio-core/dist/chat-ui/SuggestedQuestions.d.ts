/**
 * @module chat-ui/SuggestedQuestions
 * @description Starter-question cards shown on an empty chat, right above the
 * composer. The list is decided by the server (widget bootstrap / playground
 * settings) — this component only renders and reports selection.
 *
 * Ported from the widget's `ui/SuggestedQuestions.tsx`, itself a 1:1 port of
 * the dashboard Playground's MUI `SuggestedQuestionCards`, so the two surfaces
 * kept drifting apart by hand. Stacked full-width cards, 12px radius, divider
 * border, brand-tinted hover with a trailing arrow, 60ms staggered fade-up.
 *
 * Surface and border colours read the host's `--z-bg` / `--z-border` variables
 * (set on the widget's shadow root) and fall back to the tokens, so the card
 * also renders correctly in a host that sets neither.
 */
export interface SuggestedQuestionsProps {
    questions: string[];
    /** Any CSS colour — tints are derived with `color-mix`, not hex alpha. */
    brandColor: string;
    /** Small-screen sizing (tighter gutter, smaller text). */
    compact?: boolean;
    /** Called with the chosen question text (typically the chat's `send`). */
    onSelect: (question: string) => void;
    disabled?: boolean;
}
export declare function SuggestedQuestions({ questions, brandColor, compact, onSelect, disabled, }: SuggestedQuestionsProps): import("@emotion/react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=SuggestedQuestions.d.ts.map