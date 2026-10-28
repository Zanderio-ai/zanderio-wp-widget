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
export function unwrapInterrupt(interrupt) {
    if (!interrupt || typeof interrupt !== "object")
        return null;
    const obj = interrupt;
    const inner = (obj.payload ?? obj.value ?? obj);
    return inner && typeof inner === "object" ? inner : null;
}
/** The interrupt's `phase`, which decides who renders it. */
export function interruptPhase(interrupt) {
    const inner = unwrapInterrupt(interrupt);
    return inner && typeof inner.phase === "string" ? inner.phase : null;
}
//# sourceMappingURL=envelope.js.map