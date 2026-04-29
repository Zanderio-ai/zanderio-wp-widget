<?php
/**
 * Plugin Name:  Zanderio AI
 * Plugin URI:   https://zanderio.ai/integrations/wordpress
 * Description:  Connect your WordPress / WooCommerce store to Zanderio's AI-powered Sales Agent.
 * Version:      1.3.0
 * Author:       Zanderio
 * Author URI:   https://zanderio.ai
 * License:      GPL-2.0-or-later
 * License URI:  https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:  zanderio-ai
 * Requires PHP: 7.4
 * Requires at least: 5.6
 *
 * ── How it works ──
 *
 * 1. Activation:
 *    Plugin sends a handshake to the Zanderio backend, receives an
 *    Application Password authorization URL, then redirects the admin
 *    to their WP authorize-application.php page to approve access.
 *
 * 2. Normal operation:
 *    WooCommerce webhooks handle real-time product/order sync.
 *    Plugin periodically heartbeats to the Zanderio backend.
 *
 * 3. Deactivation:
 *    Notifies Zanderio → store gets disconnected, subscription paused.
 *
 * 4. Uninstall:
 *    Notifies Zanderio → all associated data is deleted.
 *    Local options are cleaned up.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/* ══════════════════════════════════════════════════════════════════════════
 * Constants
 * ══════════════════════════════════════════════════════════════════════════ */

define( 'ZANDERIO_VERSION',      '1.3.0' );
define( 'ZANDERIO_PLUGIN_FILE',  __FILE__ );
define( 'ZANDERIO_PLUGIN_DIR',   plugin_dir_path( __FILE__ ) );
define( 'ZANDERIO_PLUGIN_URL',   plugin_dir_url( __FILE__ ) );

/**
 * ⚠️  IMPORTANT: Update this to your actual Zanderio backend URL.
 *
 * Local dev:   http://localhost:3000
 * Staging:     https://api-staging.zanderio.com
 * Production:  https://api.zanderio.com
 */
if ( ! defined( 'ZANDERIO_API_URL' ) ) {
    define( 'ZANDERIO_API_URL', 'https://api.zanderio.ai' );
}

function zanderio_store_remote_identity( $body, $clear_missing = false ) {
    $store_id = '';

    if ( ! empty( $body['data']['store_id'] ) ) {
        $store_id = sanitize_text_field( $body['data']['store_id'] );
    } elseif ( ! empty( $body['data']['storeId'] ) ) {
        $store_id = sanitize_text_field( $body['data']['storeId'] );
    }

    if ( $store_id ) {
        update_option( 'zanderio_store_id', $store_id );
        return $store_id;
    }

    if ( $clear_missing ) {
        delete_option( 'zanderio_store_id' );
    }

    return '';
}

function zanderio_sync_store_identity() {
    $secret = get_option( 'zanderio_plugin_secret', '' );
    if ( ! $secret ) {
        return '';
    }

    $response = wp_remote_post(
        ZANDERIO_API_URL . '/webhooks/wordpress/compliance',
        array(
            'body'    => wp_json_encode( array(
                'event'                => 'plugin.health',
                'site_url'             => site_url(),
                'wp_version'           => get_bloginfo( 'version' ),
                'woocommerce_version'  => zanderio_get_woo_version(),
                'plugin_version'       => ZANDERIO_VERSION,
            ) ),
            'headers' => array(
                'Content-Type'      => 'application/json',
                'X-Zanderio-Secret' => $secret,
            ),
            'timeout'   => 15,
            'sslverify' => true,
        )
    );

    if ( is_wp_error( $response ) ) {
        return '';
    }

    if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
        return '';
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    return zanderio_store_remote_identity( $body );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Activation hook
 *
 * 1. POST /stores/connection/wordpress/install  →  get authorize_url + secret
 * 2. Store the plugin_secret in wp_options
 * 3. Set a transient flag so we redirect on next admin page load
 * ══════════════════════════════════════════════════════════════════════════ */
register_activation_hook( __FILE__, 'zanderio_activate' );

function zanderio_activate() {
    /* Gather site metadata */
    $payload = array(
        'site_url'             => site_url(),
        'admin_email'          => get_option( 'admin_email' ),
        'site_name'            => get_bloginfo( 'name' ),
        'wp_version'           => get_bloginfo( 'version' ),
        'woocommerce_version'  => zanderio_get_woo_version(),
        'plugin_version'       => ZANDERIO_VERSION,
        'nonce'                => wp_create_nonce( 'zanderio_handshake' ),
    );

    $response = wp_remote_post(
        ZANDERIO_API_URL . '/stores/connection/wordpress/install',
        array(
            'body'      => wp_json_encode( $payload ),
            'headers'   => array( 'Content-Type' => 'application/json' ),
            'timeout'   => 30,
            'sslverify' => true,
        )
    );

    if ( is_wp_error( $response ) ) {
        /* Couldn't reach the API — allow activation but log a notice */
        update_option( 'zanderio_activation_error', $response->get_error_message() );
        set_transient( 'zanderio_show_activation_error', true, 60 );
        return;
    }

    $code = wp_remote_retrieve_response_code( $response );
    $body = json_decode( wp_remote_retrieve_body( $response ), true );

    if ( $code !== 200 || empty( $body['data']['authorize_url'] ) ) {
        $msg = $body['message'] ?? 'Unknown error during handshake (HTTP ' . $code . ')';
        update_option( 'zanderio_activation_error', $msg );
        set_transient( 'zanderio_show_activation_error', true, 60 );
        return;
    }

    /* Store secret for lifecycle hooks */
    update_option( 'zanderio_plugin_secret', $body['data']['plugin_secret'] );
    update_option( 'zanderio_domain',        $body['data']['domain'] );
    zanderio_store_remote_identity( $body, true );

    /* Store authorize URL for redirect */
    set_transient( 'zanderio_authorize_url', $body['data']['authorize_url'], 600 );

    /* Flag to trigger redirect on next admin page load */
    set_transient( 'zanderio_redirect_after_activate', true, 60 );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Admin redirect after activation
 *
 * Redirects to the authorize-application.php page once, on the first
 * admin page load after activation.
 * ══════════════════════════════════════════════════════════════════════════ */
add_action( 'admin_init', 'zanderio_maybe_redirect' );

function zanderio_maybe_redirect() {
    if ( ! get_transient( 'zanderio_redirect_after_activate' ) ) {
        return;
    }

    delete_transient( 'zanderio_redirect_after_activate' );

    /* Don't redirect on bulk activation or AJAX */
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Standard WP activation redirect; no nonce is available here.
    if ( wp_doing_ajax() || isset( $_GET['activate-multi'] ) ) {
        return;
    }

    $authorize_url = get_transient( 'zanderio_authorize_url' );
    if ( $authorize_url ) {
        delete_transient( 'zanderio_authorize_url' );
        add_filter( 'allowed_redirect_hosts', 'zanderio_allowed_redirect_hosts' );
        wp_safe_redirect( $authorize_url );
        exit;
    }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Show activation errors as admin notices
 * ══════════════════════════════════════════════════════════════════════════ */
add_action( 'admin_notices', 'zanderio_show_admin_notices' );

function zanderio_show_admin_notices() {
    /* Activation error */
    if ( get_transient( 'zanderio_show_activation_error' ) ) {
        delete_transient( 'zanderio_show_activation_error' );
        $error = get_option( 'zanderio_activation_error', '' );
        if ( $error ) {
            echo '<div class="notice notice-error is-dismissible">';
            echo '<p><strong>Zanderio:</strong> Failed to connect — ';
            echo esc_html( $error );
            echo '</p><p>Go to <strong>Settings → Zanderio</strong> to try again.</p>';
            echo '</div>';
        }
    }

    /* Connection status notice */
    if ( ! get_option( 'zanderio_plugin_secret' ) ) {
        echo '<div class="notice notice-warning is-dismissible">';
        echo '<p><strong>Zanderio:</strong> Your store is not yet connected. ';
        echo '<a href="' . esc_url( admin_url( 'options-general.php?page=zanderio' ) ) . '">Connect now</a>.</p>';
        echo '</div>';
    }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Settings page (fallback manual connection)
 * ══════════════════════════════════════════════════════════════════════════ */
add_action( 'admin_menu', 'zanderio_add_settings_page' );

function zanderio_add_settings_page() {
    add_options_page(
        'Zanderio Settings',
        'Zanderio',
        'manage_options',
        'zanderio',
        'zanderio_render_settings_page'
    );
}

function zanderio_render_settings_page() {
    $secret = get_option( 'zanderio_plugin_secret', '' );
    $domain = get_option( 'zanderio_domain', '' );
    $connected = ! empty( $secret );

    if ( $connected && ! get_option( 'zanderio_store_id', '' ) ) {
        zanderio_sync_store_identity();
    }

    echo '<div class="wrap">';
    echo '<h1>Zanderio AI Agent</h1>';

    $widget_color = get_option( 'zanderio_widget_color', '#7E3FF2' );

    /* Handle widget colour save */
    if (
        isset( $_POST['zanderio_action'], $_POST['_wpnonce'] ) &&
        'save_widget_color' === sanitize_text_field( wp_unslash( $_POST['zanderio_action'] ) ) &&
        wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'zanderio_reconnect' )
    ) {
        $color = sanitize_hex_color( wp_unslash( $_POST['zanderio_widget_color'] ?? '' ) );
        if ( $color ) {
            update_option( 'zanderio_widget_color', $color );
            $widget_color = $color;
            echo '<div class="notice notice-success inline"><p>Widget colour saved.</p></div>';
        }
    }

    if ( $connected ) {
        echo '<div class="notice notice-success inline"><p>✅ Connected as <strong>' . esc_html( $domain ) . '</strong></p></div>';
        echo '<p>Your store is connected to Zanderio. Product and order data is being synced automatically.</p>';

        echo '<h3>Widget Appearance</h3>';
        echo '<form method="post">';
        wp_nonce_field( 'zanderio_reconnect' );
        echo '<table class="form-table"><tr>';
        echo '<th scope="row"><label for="zanderio_widget_color">Primary Color</label></th>';
        echo '<td>';
        echo '<input type="color" id="zanderio_widget_color" name="zanderio_widget_color" value="' . esc_attr( $widget_color ) . '">';
        echo ' <span class="description">Accent colour for the chat button and widget header.</span>';
        echo '</td></tr></table>';
        echo '<p class="submit"><button type="submit" name="zanderio_action" value="save_widget_color" class="button button-primary">Save Colour</button></p>';
        echo '</form>';

        echo '<h3>Actions</h3>';
        echo '<form method="post">';
        wp_nonce_field( 'zanderio_reconnect' );
        echo '<button type="submit" name="zanderio_action" value="reconnect" class="button button-secondary">Reconnect</button> ';
        echo '<button type="submit" name="zanderio_action" value="test_health" class="button button-secondary">Test Connection</button>';
        echo '</form>';
    } else {
        echo '<div class="notice notice-warning inline"><p>⚠️ Not connected.</p></div>';
        echo '<p>Click the button below to connect your store to Zanderio.</p>';
        echo '<form method="post">';
        wp_nonce_field( 'zanderio_reconnect' );
        echo '<button type="submit" name="zanderio_action" value="reconnect" class="button button-primary">Connect to Zanderio</button>';
        echo '</form>';
    }

    echo '</div>';

    /* Handle form submissions */
    if (
        isset( $_POST['zanderio_action'], $_POST['_wpnonce'] ) &&
        wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'zanderio_reconnect' )
    ) {
        $action = sanitize_text_field( wp_unslash( $_POST['zanderio_action'] ) );

        if ( $action === 'reconnect' ) {
            zanderio_do_handshake_and_redirect();
        } elseif ( $action === 'test_health' ) {
            zanderio_do_health_check();
        }
    }
}

/**
 * Trigger handshake and redirect to authorize URL (used from settings page).
 */
function zanderio_do_handshake_and_redirect() {
    $payload = array(
        'site_url'             => site_url(),
        'admin_email'          => get_option( 'admin_email' ),
        'site_name'            => get_bloginfo( 'name' ),
        'wp_version'           => get_bloginfo( 'version' ),
        'woocommerce_version'  => zanderio_get_woo_version(),
        'plugin_version'       => ZANDERIO_VERSION,
        'nonce'                => wp_create_nonce( 'zanderio_handshake' ),
    );

    $response = wp_remote_post(
        ZANDERIO_API_URL . '/stores/connection/wordpress/install',
        array(
            'body'      => wp_json_encode( $payload ),
            'headers'   => array( 'Content-Type' => 'application/json' ),
            'timeout'   => 30,
            'sslverify' => true,
        )
    );

    if ( is_wp_error( $response ) ) {
        echo '<div class="notice notice-error"><p>Connection failed: ' . esc_html( $response->get_error_message() ) . '</p></div>';
        return;
    }

    $code = wp_remote_retrieve_response_code( $response );
    $body = json_decode( wp_remote_retrieve_body( $response ), true );

    if ( $code !== 200 || empty( $body['data']['authorize_url'] ) ) {
        $msg = $body['message'] ?? 'Unknown error (HTTP ' . $code . ')';
        echo '<div class="notice notice-error"><p>Handshake failed: ' . esc_html( $msg ) . '</p></div>';
        return;
    }

    update_option( 'zanderio_plugin_secret', $body['data']['plugin_secret'] );
    update_option( 'zanderio_domain',        $body['data']['domain'] );
    zanderio_store_remote_identity( $body, true );

    add_filter( 'allowed_redirect_hosts', 'zanderio_allowed_redirect_hosts' );
    wp_safe_redirect( $body['data']['authorize_url'] );
    exit;
}

/**
 * Allow Zanderio hosts for safe redirects (authorize-application flow).
 *
 * @param  array $hosts Existing allowed hosts.
 * @return array
 */
function zanderio_allowed_redirect_hosts( $hosts ) {
    $hosts[] = 'zanderio.ai';
    $hosts[] = 'api.zanderio.ai';
    return $hosts;
}

/**
 * Send a health heartbeat from the settings page.
 */
function zanderio_do_health_check() {
    $secret = get_option( 'zanderio_plugin_secret', '' );
    if ( ! $secret ) {
        echo '<div class="notice notice-error"><p>No plugin secret found. Please reconnect first.</p></div>';
        return;
    }

    $payload = array(
        'site_url'             => site_url(),
        'wp_version'           => get_bloginfo( 'version' ),
        'woocommerce_version'  => zanderio_get_woo_version(),
        'plugin_version'       => ZANDERIO_VERSION,
    );

    $response = wp_remote_post(
        ZANDERIO_API_URL . '/webhooks/wordpress/compliance',
        array(
            'body'    => wp_json_encode( array_merge( $payload, array(
                'event' => 'plugin.health',
            ) ) ),
            'headers' => array(
                'Content-Type'      => 'application/json',
                'X-Zanderio-Secret' => $secret,
            ),
            'timeout'   => 15,
            'sslverify' => true,
        )
    );

    if ( is_wp_error( $response ) ) {
        echo '<div class="notice notice-error"><p>Health check failed: ' . esc_html( $response->get_error_message() ) . '</p></div>';
        return;
    }

    $code = wp_remote_retrieve_response_code( $response );
    $body = json_decode( wp_remote_retrieve_body( $response ), true );

    if ( 200 === $code ) {
        zanderio_store_remote_identity( $body );
    }

    if ( $code === 200 && ! empty( $body['data']['connected'] ) ) {
        echo '<div class="notice notice-success"><p>✅ Connection healthy.</p></div>';
    } else {
        $msg = $body['message'] ?? 'Unknown response';
        echo '<div class="notice notice-warning"><p>Health check returned: ' . esc_html( $msg ) . '</p></div>';
    }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Deactivation hook
 *
 * Notifies Zanderio → disconnects the store, pauses subscription.
 * Does NOT delete options (user might reactivate).
 * ══════════════════════════════════════════════════════════════════════════ */
register_deactivation_hook( __FILE__, 'zanderio_deactivate' );

function zanderio_deactivate() {
    $secret = get_option( 'zanderio_plugin_secret', '' );
    if ( ! $secret ) {
        return;
    }

    wp_remote_post(
        ZANDERIO_API_URL . '/webhooks/wordpress/compliance',
        array(
            'body'    => wp_json_encode( array(
                'event'     => 'plugin.deactivated',
                'site_url'  => site_url(),
                'timestamp' => time(),
            ) ),
            'headers' => array(
                'Content-Type'      => 'application/json',
                'X-Zanderio-Secret' => $secret,
            ),
            'timeout'   => 15,
            'blocking'  => false, /* Fire-and-forget — don't block deactivation */
            'sslverify' => true,
        )
    );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Uninstall hook (static — must be file reference)
 *
 * WordPress calls this file when the user deletes the plugin from
 * Plugins → Delete.  We notify Zanderio to redact all data, then clean
 * up local wp_options.
 *
 * NOTE: register_uninstall_hook uses a static callback reference that
 * WordPress stores in a special option.  It triggers even if the plugin
 * is not active.
 * ══════════════════════════════════════════════════════════════════════════ */
register_uninstall_hook( __FILE__, 'zanderio_uninstall' );

function zanderio_uninstall() {
    $secret = get_option( 'zanderio_plugin_secret', '' );

    if ( $secret ) {
        wp_remote_post(
            ZANDERIO_API_URL . '/webhooks/wordpress/compliance',
            array(
                'body'    => wp_json_encode( array(
                    'event'     => 'plugin.uninstalled',
                    'site_url'  => site_url(),
                    'timestamp' => time(),
                ) ),
                'headers' => array(
                    'Content-Type'      => 'application/json',
                    'X-Zanderio-Secret' => $secret,
                ),
                'timeout'   => 15,
                'sslverify' => true,
            )
        );
    }

    /* Clean up ALL plugin options */
    delete_option( 'zanderio_plugin_secret' );
    delete_option( 'zanderio_domain' );
    delete_option( 'zanderio_store_id' );
    delete_option( 'zanderio_widget_color' );
    delete_option( 'zanderio_activation_error' );
    delete_transient( 'zanderio_authorize_url' );
    delete_transient( 'zanderio_redirect_after_activate' );
    delete_transient( 'zanderio_show_activation_error' );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Scheduled health heartbeat (daily)
 * ══════════════════════════════════════════════════════════════════════════ */
add_action( 'zanderio_daily_heartbeat', 'zanderio_send_heartbeat' );

/**
 * Schedule the daily heartbeat on activation, clear on deactivation.
 */
register_activation_hook( __FILE__, function() {
    if ( ! wp_next_scheduled( 'zanderio_daily_heartbeat' ) ) {
        wp_schedule_event( time(), 'daily', 'zanderio_daily_heartbeat' );
    }
});

register_deactivation_hook( __FILE__, function() {
    wp_clear_scheduled_hook( 'zanderio_daily_heartbeat' );
});

function zanderio_send_heartbeat() {
    $secret = get_option( 'zanderio_plugin_secret', '' );
    if ( ! $secret ) {
        return;
    }

    wp_remote_post(
        ZANDERIO_API_URL . '/webhooks/wordpress/compliance',
        array(
            'body'    => wp_json_encode( array(
                'event'                => 'plugin.health',
                'site_url'             => site_url(),
                'wp_version'           => get_bloginfo( 'version' ),
                'woocommerce_version'  => zanderio_get_woo_version(),
                'plugin_version'       => ZANDERIO_VERSION,
            ) ),
            'headers' => array(
                'Content-Type'      => 'application/json',
                'X-Zanderio-Secret' => $secret,
            ),
            'timeout'   => 15,
            'blocking'  => false,
            'sslverify' => true,
        )
    );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Utility helpers
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * Get the active WooCommerce version, or null if not installed/active.
 *
 * @return string|null
 */
function zanderio_get_woo_version() {
    if ( defined( 'WC_VERSION' ) ) {
        return WC_VERSION;
    }
    if ( function_exists( 'WC' ) && is_callable( array( WC(), 'version' ) ) ) {
        return WC()->version;
    }
    /* Check the plugin file directly */
    $woo_file = WP_PLUGIN_DIR . '/woocommerce/woocommerce.php';
    if ( file_exists( $woo_file ) ) {
        $data = get_plugin_data( $woo_file, false, false );
        return $data['Version'] ?? null;
    }
    return null;
}

/* ══════════════════════════════════════════════════════════════════════════
 * Widget Injection to Storefront
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * Enqueues the bundled widget script from the plugin's own assets/ directory.
 *
 * The widget JS is compiled into the plugin zip at build time
 * (npm run build:wordpress) — no remote code is fetched or executed.
 * wp_add_inline_script emits the config block immediately before the
 * script tag so it is always available when the widget initialises.
 */
add_action( 'wp_enqueue_scripts', 'zanderio_enqueue_widget' );

function zanderio_enqueue_widget() {
    if ( is_admin() || is_customize_preview() ) {
        return;
    }

    if ( ! get_option( 'zanderio_plugin_secret', '' ) ) {
        return;
    }

    $domain        = get_option( 'zanderio_domain', '' );
    $store_id      = get_option( 'zanderio_store_id', '' );
    $primary_color = get_option( 'zanderio_widget_color', '#7E3FF2' );

    wp_register_script(
        'zanderio-widget',
        ZANDERIO_PLUGIN_URL . 'assets/loader.js',
        array(),           /* no dependencies */
        ZANDERIO_VERSION,  /* version-stamped so browsers invalidate on plugin update */
        array(
            'strategy'  => 'defer',
            'in_footer' => true,
        )
    );

    wp_enqueue_script( 'zanderio-widget' );

    $config = array(
        'shopDomain'   => $domain ?: '',
        'primaryColor' => $primary_color,
    );

    if ( $store_id ) {
        $config['storeId'] = $store_id;
    }

    $config = wp_json_encode( $config );

    /*
     * ZanderioWidgetLoaded guard prevents double-initialisation if a caching
     * or page-builder plugin outputs the footer hook more than once.
     */
    wp_add_inline_script(
        'zanderio-widget',
        'if (!window.ZanderioWidgetLoaded) {
  window.ZanderioWidgetLoaded = true;
  window.ZanderioWidgetConfig = ' . $config . ';
}',
        'before'
    );
}

/**
 * Enqueues the positioning CSS for the widget host container via
 * wp_add_inline_style (attached to a minimal registered stylesheet).
 */
add_action( 'wp_enqueue_scripts', 'zanderio_enqueue_widget_styles' );

function zanderio_enqueue_widget_styles() {
    if ( is_admin() || is_customize_preview() ) {
        return;
    }

    if ( ! get_option( 'zanderio_plugin_secret', '' ) ) {
        return;
    }

    wp_register_style( 'zanderio-widget-host', false, array(), ZANDERIO_VERSION );
    wp_enqueue_style( 'zanderio-widget-host' );
    wp_add_inline_style( 'zanderio-widget-host',
        '#zanderio-widget-host {'
        . 'display:block!important;'
        . 'position:fixed!important;'
        . 'bottom:0!important;'
        . 'right:0!important;'
        . 'width:0!important;'
        . 'height:0!important;'
        . 'z-index:2147483647!important;'
        . 'background:transparent!important;'
        . 'pointer-events:none!important;'
        . '}'
    );
}

/**
 * Outputs the Shadow DOM host element in the footer.
 * Mirrors the Shopify theme extension block exactly.
 */
add_action( 'wp_footer', 'zanderio_inject_widget_host' );

function zanderio_inject_widget_host() {
    if ( is_admin() || is_customize_preview() ) {
        return;
    }

    if ( ! get_option( 'zanderio_plugin_secret', '' ) ) {
        return;
    }
    ?>
    <div id="zanderio-widget-host"></div>
    <?php
}
