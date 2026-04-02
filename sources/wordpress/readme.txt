=== Zanderio AI ===
Contributors: zanderio
Tags: chat, ai, widget, sales agent, woocommerce
Requires at least: 5.6
Tested up to: 6.9
Stable tag: 1.2.0
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

**Client-side (widget.js):**

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

The file `assets/widget.js` is a minified production build.  The full,
human-readable source code is available on GitHub:

**Source repository:** [https://github.com/Zanderio-ai/zanderio-wp-widget](https://github.com/Zanderio-ai/zanderio-wp-widget)

To build `widget.js` from source:

1. Clone the repository: `git clone https://github.com/Zanderio-ai/zanderio-wp-widget.git`
2. Install dependencies: `npm install`
3. Build for WordPress: `npm run build:wordpress:prod`

The compiled file is output to `sources/wordpress/assets/widget.js`.

Build toolchain: [Vite](https://vitejs.dev/) + [React](https://react.dev/) +
[Terser](https://terser.org/) (minifier).

== Changelog ==

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
* Widget JS is now bundled inside the plugin zip (assets/widget.js) — no
  remote script is fetched or executed at runtime.
* Script and CSS enqueued via wp_enqueue_script, wp_enqueue_style and
  wp_add_inline_style for full WordPress compatibility.
* Added widget host container with fixed-position CSS, matching the Shopify
  theme extension exactly.
* Added ZanderioWidgetLoaded guard against double-initialisation.
* Added Primary Color picker to Settings → Zanderio.

= 1.0.0 =
* Initial release.
