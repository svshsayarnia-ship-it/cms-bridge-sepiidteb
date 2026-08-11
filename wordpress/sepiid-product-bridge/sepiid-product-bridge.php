<?php
/**
 * Plugin Name:       Sepiid Product Bridge
 * Plugin URI:        https://sepiidbeauty.ir/
 * Description:       اتصال امن Sepiid CMS و حساب مشتریان به WooCommerce، دسته‌بندی‌ها و رسانه‌ها.
 * Version:           1.8.1
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

/*
 * 1.8.1 deliberately avoids declaring the historical namespace-level
 * VERSION/FILE/PATH constants and boot helper functions during plugin load.
 * Older installations used the same symbols, so two accidentally active plugin
 * folders could previously cause a PHP redeclare fatal before WordPress had a
 * chance to deactivate either copy.
 */
if ( ! class_exists( __NAMESPACE__ . '\\Plugin_Bootstrap_181', false ) ) {
	final class Plugin_Bootstrap_181 {
		const VERSION = '1.8.1';

		private static $registered = false;
		private static $suppressed = false;
		private static $file = '';
		private static $path = '';

		/**
		 * Register hooks once even if the same 1.8.1 package exists twice.
		 *
		 * @param string $file Plugin entry file.
		 * @param string $path Plugin directory.
		 * @return void
		 */
		public static function register( $file, $path ) {
			if ( self::$registered ) {
				return;
			}

			self::$registered = true;
			self::$file       = $file;
			self::$path       = $path;

			add_action( 'plugins_loaded', array( __CLASS__, 'boot' ), 99 );
			add_action( 'before_woocommerce_init', array( __CLASS__, 'declare_woocommerce_compatibility' ) );
		}

		/**
		 * Detect an older Sepiid Product Bridge copy that WordPress already loaded.
		 *
		 * @return bool
		 */
		private static function legacy_copy_loaded() {
			return function_exists( __NAMESPACE__ . '\\boot' )
				|| function_exists( __NAMESPACE__ . '\\declare_woocommerce_compatibility' )
				|| defined( __NAMESPACE__ . '\\VERSION' )
				|| class_exists( __NAMESPACE__ . '\\Rest_Controller', false )
				|| class_exists( __NAMESPACE__ . '\\Admin', false );
		}

		/**
		 * Boot the canonical bridge only when no older copy is already active.
		 *
		 * @return void
		 */
		public static function boot() {
			if ( self::legacy_copy_loaded() ) {
				self::$suppressed = true;
				if ( is_admin() ) {
					add_action( 'admin_notices', array( __CLASS__, 'render_duplicate_notice' ) );
				}
				return;
			}

			// Keep backwards-compatible symbols for the internal controller files,
			// but create them only after duplicate detection has passed.
			define( __NAMESPACE__ . '\\VERSION', self::VERSION );
			define( __NAMESPACE__ . '\\FILE', self::$file );
			define( __NAMESPACE__ . '\\PATH', self::$path );

			require_once self::$path . '/includes/class-rest-controller.php';
			require_once self::$path . '/includes/class-customer-auth-controller.php';
			require_once self::$path . '/includes/class-site-presentation-controller.php';
			require_once self::$path . '/includes/class-admin.php';

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

		/**
		 * Declare compatibility only when this copy is the active bridge.
		 *
		 * @return void
		 */
		public static function declare_woocommerce_compatibility() {
			if ( self::$suppressed || ! class_exists( '\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil' ) ) {
				return;
			}

			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
				'custom_order_tables',
				self::$file,
				true
			);
		}

		/**
		 * Explain a duplicate installation instead of crashing the site.
		 *
		 * @return void
		 */
		public static function render_duplicate_notice() {
			if ( ! current_user_can( 'activate_plugins' ) ) {
				return;
			}
			?>
			<div class="notice notice-error">
				<p><strong>Sepiid Product Bridge:</strong> یک نسخه قدیمی دیگر از افزونه هم‌زمان فعال است. نسخه قدیمی را غیرفعال یا پوشه آن را حذف کن؛ نسخه 1.8.1 برای جلوگیری از Fatal خودکار متوقف شده است.</p>
			</div>
			<?php
		}
	}
}

Plugin_Bootstrap_181::register( __FILE__, __DIR__ );
