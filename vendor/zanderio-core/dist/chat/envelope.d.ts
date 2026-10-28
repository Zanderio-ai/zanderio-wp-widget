/**
 * @module chat/envelope
 * @description Reading a pending interrupt off the stream.
 *
 * The AI service wraps an interrupt payload differently depending on whether it
 * arrived live over SSE or was rehydrated from thread state, so callers see
 * `{ payload: {...} }`, `{ value: {...} }`, or the bare payload. Knowing that is
 * contract knowledge, not presentation — which is why it lives here rather than
 * with the cards that render the result.
 */
/** Unwrap the `payload` / `value` envelope, returning the payload itself. */
export declare function unwrapInterrupt(interrupt: unknown): Record<string, unknown> | null;
/** The interrupt's `phase`, which decides who renders it. */
export declare function interruptPhase(interrupt: unknown): string | null;
//# sourceMappingURL=envelope.d.ts.map