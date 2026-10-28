/**
 * @module chat/types
 * @description The chat stream contract shared by the widget and the dashboard.
 *
 * These mirror the AI service's Python schemas and are the frontend half of a
 * cross-language contract. They existed twice before (widget
 * `core/chat-types.ts`, dashboard `shared/chat/history.ts`) and drifted: the
 * dashboard had the whole payments flow typed while the widget had none of it,
 * so the widget could not render a payments interrupt at all.
 *
 * Backend counterparts, worth checking when any of this changes:
 *   ai/app/modules/booking/schemas.py::InterruptEnvelope
 *   ai/app/modules/crm/nodes.py::crm_collect
 *   ai/app/modules/payments/nodes.py
 *   ai/app/contracts/artifacts.py::CrmData
 *   ai/app/contracts/artifacts.py::CarouselItem, ProductData (match_label)
 *   ai/app/contracts/parts.py (data-audio, data-image)
 */
export {};
//# sourceMappingURL=types.js.map