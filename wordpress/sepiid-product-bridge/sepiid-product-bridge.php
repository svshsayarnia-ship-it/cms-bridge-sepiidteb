<?php
/**
 * Plugin Name:       Sepiid Product Bridge
 * Plugin URI:        https://sepiidbeauty.ir/
 * Description:       اتصال امن Sepiid CMS و حساب مشتریان به محصولات، دسته‌بندی‌ها، رسانه‌ها و WooCommerce.
 * Version:           1.8.13
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

const VERSION = '1.8.13';
const FILE    = __FILE__;
const PATH    = __DIR__;

/**
 * Declare compatibility only for WooCommerce features this bridge does not alter.
 *
 * @return void
 */
function declare_woocommerce_compatibility() {
	if ( ! class_exists( '\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil' ) ) {
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
	require_once PATH . '/includes/class-site-presentation-controller.php';
	require_once PATH . '/includes/class-customer-auth-controller.php';
	require_once PATH . '/includes/class-customer-password-policy.php';
	require_once PATH . '/includes/class-customer-otp-controller.php';
	require_once PATH . '/includes/class-razban-otp-provider.php';
	require_once PATH . '/includes/class-kavenegar-direct-otp-provider.php';
	require_once PATH . '/includes/class-customer-identity-controller.php';
	require_once PATH . '/includes/class-admin.php';

	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', array( Admin::class, 'render_missing_woocommerce_notice' ) );
		return;
	}

	$rest_controller = new Rest_Controller();
	$rest_controller->hooks();

	$site_presentation_controller = new Site_Presentation_Controller();
	$site_presentation_controller->hooks();

	$customer_auth_controller = new Customer_Auth_Controller();
	$customer_auth_controller->hooks();

	$customer_password_policy = new Customer_Password_Policy();
	$customer_password_policy->hooks();

	$razban_otp_provider = new Razban_Otp_Provider();
	$razban_otp_provider->hooks();

	$kavenegar_direct_otp_provider = new Kavenegar_Direct_Otp_Provider();
	$kavenegar_direct_otp_provider->hooks();

	$customer_otp_controller = new Customer_Otp_Controller();
	$customer_otp_controller->hooks();

	$customer_identity_controller = new Customer_Identity_Controller();
	$customer_identity_controller->hooks();

	if ( is_admin() ) {
		$admin = new Admin();
		$admin->hooks();
	}
}
add_action( 'plugins_loaded', __NAMESPACE__ . '\\boot', 20 );
