<?php
/**
 * Plugin Name:       Sepiid Product Bridge
 * Plugin URI:        https://sepiidbeauty.ir/
 * Description:       اتصال امن Sepiid CMS و حساب مشتریان به WooCommerce، دسته‌بندی‌ها و رسانه‌ها.
 * Version:           1.8.0
 * Requires at least: 6.9
 * Requires PHP:      7.4
 * Author:            Sepiid Beauty
 * Author URI:        https://sepiidbeauty.ir/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       sepiid-product-bridge
 * Requires Plugins:  woocommerce
 * WC requires at least: 8.0
 * WC tested up to:   10.9
 * Update URI:        https://sepiidbeauty.ir/sepiid-product-bridge/
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

const VERSION = '1.8.0';
const FILE    = __FILE__;
const PATH    = __DIR__;

/**
 * Declare compatibility only for WooCommerce features this bridge does not alter.
 *
 * The plugin uses public WordPress media/user APIs and WooCommerce REST
 * authentication. It never reads or writes order storage directly.
 *
 * @return void
 */
function declare_woocommerce_compatibility() {
	if ( ! class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
		return;
	}

	\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
		'custom_order_tables',
		FILE,
		true
	);
}
add_action( 'before_woocommerce_init', __NAMESPACE__ . '\\declare_woocommerce_compatibility' );

/**
 * Boot after WooCommerce has initialized its REST authentication hooks.
 *
 * @return void
 */
function boot() {
	require_once PATH . '/includes/class-rest-controller.php';
	require_once PATH . '/includes/class-customer-auth-controller.php';
	require_once PATH . '/includes/class-site-presentation-controller.php';
	require_once PATH . '/includes/class-admin.php';

	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', array( Admin::class, 'render_missing_woocommerce_notice' ) );
		return;
	}

	$rest_controller = new Rest_Controller();
	$rest_controller->hooks();

	$customer_auth_controller = new Customer_Auth_Controller();
	$customer_auth_controller->hooks();

	$site_presentation_controller = new Site_Presentation_Controller();
	$site_presentation_controller->hooks();

	if ( is_admin() ) {
		$admin = new Admin();
		$admin->hooks();
	}
}
add_action( 'plugins_loaded', __NAMESPACE__ . '\\boot', 20 );
