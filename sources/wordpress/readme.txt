=== Zanderio AI ===
Contributors: zanderio
Tags: chat, ai, widget, sales agent, woocommerce
Requires at least: 5.6
Tested up to: 6.9
Stable tag: 1.3.2
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Connect your WordPress / WooCommerce store to Zanderio's AI-powered Sales Agent.

== Description ==

Zanderio AI connects your Wordpress site or WooCommerce store to an AI-powered sales agent that
answers customer questions in real time using your live product and order data.

The chat widget is bundled directly inside the plugin — no external scripts are
loaded or executed at runtime.  All communication with the Zanderio service uses
your store's existing Application Password credentials over HTTPS.

Features:

* One-click activation — auto-handshake with Zanderio backend
* Application Password authentication (no manual API keys)
* WooCommerce product/order sync via webhooks
* Widget colour customisation from Settings → Zanderio
* Daily health heartbeat
* Clean uninstall — all data removed from both sides

== Installation ==

1. Upload `zanderio-ai/` to `/wp-content/plugins/`.
2. Activate the plugin via **Plugins** in the WordPress admin.
3. You will be redirected to authorize the connection.
4. Once connected, the widget appears automatically on the storefront.

== External Services ==

This plugin connects your WordPress site to the **Zanderio** external service
(`zanderio.ai`).  Two endpoints are used:

= api.zanderio.ai (REST API) =

Used server-side by the plugin (PHP) and client-side by the chat widget (JS).

**Server-side (PHP):**

* **On activation** — sends your store URL, site name, admin email, WordPress
  version, WooCommerce version, and plugin version to register the store.
* **Webhooks** — WooCommerce product and order data is pushed via webhooks so
  the AI agent can answer customer questions accurately.
* **Daily heartbeat** — a lightweight ping confirming the store is still active.
* **On deactivation / uninstall** — notifies Zanderio to disconnect the store
  and delete associated data.

**Client-side (loader.js):**

* **Chat conversations** — visitor messages typed into the chat widget are sent
  over HTTPS to the REST API for AI processing.  No personally identifiable
  visitor data is stored by the plugin itself.

= ws.zanderio.ai (WebSocket) =

Used client-side by the chat widget (JS) to provide real-time, streaming
responses from the AI agent.  The WebSocket connection is opened when a visitor
starts a chat conversation and transmits the same conversation data as the
REST API above.

**Links:**

* [Zanderio Terms of Service](https://zanderio.ai/resources/terms-and-conditions)
* [Zanderio Privacy Policy](https://zanderio.ai/resources/privacy-policy)

== Source Code & Build Tools ==

The file `assets/loader.js` is a minified production build.  The full,
human-readable source code is available on GitHub:

**Source repository:** [https://github.com/Zanderio-ai/zanderio-wp-widget](https://github.com/Zanderio-ai/zanderio-wp-widget)

To build `loader.js` from source:

1. Clone the repository: `git clone https://github.com/Zanderio-ai/zanderio-wp-widget.git`
2. Install dependencies: `npm install`
3. Build for WordPress: `npm run build:wordpress:prod`

The compiled file is output to `sources/wordpress/assets/loader.js`.

Build toolchain: [Vite](https://vitejs.dev/) + [React](https://react.dev/) +
[Terser](https://terser.org/) (minifier).

== Changelog ==

= 1.3.2 =
* Added cart preview sheet component for in-widget cart confirmation before adding items.
* Enhanced artifact component styling with improved product cards, carousels, notices, lists, tables, and wizards.
* Added cart preview sheet complement styles with quantity controls and product details.
* Improved artifact product card cart button interactions and disabled states.

= 1.3.1 =
* Fixed confirmation cards not displaying description text or action buttons — booking confirmations and cart flows now render correctly.
* Fixed wizard step progress not showing step descriptions.
* Improved SSE stream version validation to handle both numeric and string version numbers from backend.
* Consolidated form field schema for improved type safety across all widget surfaces.

= 1.3.0 =
* Fixed add-to-cart button not appearing for product recommendations — products now render through the full WooCommerce ProductCard / ProductCarousel regardless of whether they arrive via the new or legacy pipeline.
* Upgraded WordPress widget to the full 10-kind artifact taxonomy (card, select, confirm, notice, feedback, list, table, wizard, text, form), matching the general CDN widget and client-side playground exactly.
* New artifact kinds (booking confirmation flows, datetime slot pickers, quick-reply chips, data tables, multi-step wizard progress, inline forms, notices) now render correctly.
* Removed all legacy message-type dispatching — all AI responses flow through the unified artifact pipeline; product normalization happens once in the message hook before rendering.
* Added searching_calendar skeleton loading state to match the general widget.
* Removed dependency on the separate FeedbackButtons component; feedback is now handled inline via the feedback artifact kind.

= 1.2.5 =
* Restored product browsing to a clean arrow-based carousel with minimal store-themed previous and next controls.
* Refined product-card actions so direct WooCommerce adds use a compact cart icon button and choose-options flows show a disabled in-button loader before navigation.
* Updated the product loading state to match the restored arrow-based carousel layout.
* Improved chat refresh recovery by restoring the latest visitor conversation when the persisted conversation ID is missing or stale.

= 1.2.4 =
* Replaced the arrow-based product carousel with a gesture-first horizontal swipe rail for browsing product results inside the chat widget.
* Reworked the loading state into full-card skeleton placeholders that match the live product rail layout.
* Reduced the product-card footprint and improved CTA visibility so key actions stay visible inside the widget viewport.
* Prevented unresolved multi-variant WooCommerce products from attempting broken AJAX cart adds by routing shoppers to the product page to choose options first.

= 1.2.3 =
* Added a product-card cart confirmation flow for WooCommerce storefronts, including an in-widget bottom-sheet preview before the item is added to cart.
* Added quantity controls and clearer product, variant, and pricing details inside the cart confirmation sheet.
* Limited the product-card cart flow to WooCommerce and WordPress storefronts instead of attempting unsupported storefront cart mutations.
* Improved WordPress store relinking so plugin installs can attach cleanly to an already-connected Zanderio store during reconnect and portal-first install flows.

= 1.2.2 =
* Fixed a small streaming-cursor rendering issue that could show an empty message bubble before streamed text arrived.

= 1.2.1 =
* Refreshed the chat widget design with improved spacing, contrast-aware accent colors, a pill-style composer, and smoother message-area behavior.
* Improved the in-chat product experience with richer product cards, better variant summaries, swatches, pricing display, and stock-state feedback.
* Added storefront cart actions for WooCommerce with lightweight success and failure toast feedback.
* Improved message rendering with better action button handling, safer external link normalization, and a compact expandable thinking-status pill.
* Added storeId-aware widget bootstrap support in the WordPress plugin.
* Persist the remote store identity from install, reconnect, and authenticated health-check responses.
* Connected stores now self-heal a missing local storeId from the settings page before rendering widget config.
* Inject `storeId` into `window.ZanderioWidgetConfig` when known so the widget can bootstrap against the correct store.
* Clean up the persisted remote store identity on uninstall to avoid stale local metadata.
* Prepared the plugin for exact-origin widget hardening rollout while keeping the current compatibility path in place.

= 1.2.0 =
* Full AI streaming support — real-time SSE responses via fetch + ReadableStream.
* Thread persistence — conversation history survives page reloads.
* JWT authentication for secure AI streaming sessions.
* Thinking status indicators — contextual labels while the AI processes.
* Conversation lifecycle — end states, "Start New Chat" button.
* Proactive engagement — configurable bubble to encourage visitors to chat.
* Feedback buttons — thumbs up/down on AI responses.
* Suggestion chips — quick-reply options from the AI.
* Error handling — friendly messages for 401/403/429/5xx responses.
* Streaming cursor animation and error message styling.
* Nested config support for updated backend schema.

= 1.1.0 =
* Widget JS is now bundled inside the plugin zip (assets/loader.js) — no
  remote script is fetched or executed at runtime.
* Script and CSS enqueued via wp_enqueue_script, wp_enqueue_style and
  wp_add_inline_style for full WordPress compatibility.
* Added widget host container with fixed-position CSS, matching the Shopify
  theme extension exactly.
* Added ZanderioWidgetLoaded guard against double-initialisation.
* Added Primary Color picker to Settings → Zanderio.

= 1.0.0 =
* Initial release.
