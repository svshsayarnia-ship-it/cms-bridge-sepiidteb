<?php
/**
 * WordPress admin status screen.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

/**
 * Provides a read-only diagnostics page under WooCommerce.
 */
final class Admin {
	/**
	 * Register admin hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action( 'admin_menu', array( $this, 'add_menu' ), 80 );
		add_filter( 'plugin_action_links_' . plugin_basename( FILE ), array( $this, 'action_links' ) );
	}

	/**
	 * Add the bridge status page below WooCommerce.
	 *
	 * @return void
	 */
	public function add_menu() {
		add_submenu_page(
			'woocommerce',
			'Sepiid Product Bridge',
			'Sepiid Bridge',
			'manage_woocommerce',
			'sepiid-product-bridge',
			array( $this, 'render_page' )
		);
	}

	/**
	 * Add a direct status-page link on the Plugins screen.
	 *
	 * @param array $links Existing action links.
	 * @return array
	 */
	public function action_links( $links ) {
		array_unshift(
			$links,
			'<a href="' . esc_url( admin_url( 'admin.php?page=sepiid-product-bridge' ) ) . '">وضعیت اتصال</a>'
		);

		return $links;
	}

	/**
	 * Render a visible dependency warning on older WordPress installations.
	 *
	 * @return void
	 */
	public static function render_missing_woocommerce_notice() {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		?>
		<div class="notice notice-error">
			<p><strong>Sepiid Product Bridge:</strong> برای فعال‌شدن اتصال CMS، افزونه WooCommerce باید نصب و فعال باشد.</p>
		</div>
		<?php
	}

	/**
	 * Render a no-JavaScript diagnostics page.
	 *
	 * @return void
	 */
	public function render_page() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'sepiid-product-bridge' ) );
		}

		global $wp_version;

		$can_manage_products = current_user_can( 'edit_products' ) || current_user_can( 'manage_woocommerce' );
		$can_upload          = $can_manage_products && current_user_can( 'upload_files' );
		$health_url          = rest_url( Rest_Controller::REST_NAMESPACE . '/sepiid-bridge/health' );
		$media_url           = rest_url( Rest_Controller::REST_NAMESPACE . '/sepiid-media' );
		$server_upload_limit = (int) wp_max_upload_size();
		$max_upload_bytes    = $server_upload_limit > 0
			? min( Rest_Controller::MAX_UPLOAD_BYTES, $server_upload_limit )
			: Rest_Controller::MAX_UPLOAD_BYTES;
		?>
		<div class="wrap" dir="rtl">
			<h1>Sepiid Product Bridge</h1>
			<p>این صفحه فقط وضعیت اتصال را نشان می‌دهد. کلیدهای WooCommerce در این افزونه ذخیره نمی‌شوند.</p>

			<?php if ( $can_manage_products && $can_upload ) : ?>
				<div class="notice notice-success inline"><p><strong>آماده اتصال:</strong> دسترسی مدیریت محصول و آپلود رسانه برای این کاربر فعال است.</p></div>
			<?php else : ?>
				<div class="notice notice-warning inline"><p><strong>نیاز به بررسی مجوز:</strong> کاربری که کلید REST برای او ساخته می‌شود باید مجوز مدیریت محصول و <code>upload_files</code> داشته باشد.</p></div>
			<?php endif; ?>

			<table class="widefat striped" style="max-width: 920px; margin-top: 20px; direction: rtl;">
				<tbody>
					<tr>
						<th scope="row" style="width: 240px;">نسخه افزونه</th>
						<td><code><?php echo esc_html( VERSION ); ?></code></td>
					</tr>
					<tr>
						<th scope="row">نسخه WordPress</th>
						<td><code><?php echo esc_html( isset( $wp_version ) ? $wp_version : 'نامشخص' ); ?></code></td>
					</tr>
					<tr>
						<th scope="row">نسخه WooCommerce</th>
						<td><code><?php echo esc_html( defined( 'WC_VERSION' ) ? WC_VERSION : 'نامشخص' ); ?></code></td>
					</tr>
					<tr>
						<th scope="row">مدیریت محصولات</th>
						<td><?php echo $can_manage_products ? 'فعال' : 'غیرفعال'; ?></td>
					</tr>
					<tr>
						<th scope="row">آپلود رسانه</th>
						<td><?php echo $can_upload ? 'فعال' : 'غیرفعال'; ?></td>
					</tr>
					<tr>
						<th scope="row">حداکثر حجم هر تصویر</th>
						<td><?php echo esc_html( size_format( $max_upload_bytes ) ); ?></td>
					</tr>
					<tr>
						<th scope="row">Health endpoint</th>
						<td><code dir="ltr"><?php echo esc_html( $health_url ); ?></code></td>
					</tr>
					<tr>
						<th scope="row">Media endpoint</th>
						<td><code dir="ltr"><?php echo esc_html( $media_url ); ?></code></td>
					</tr>
				</tbody>
			</table>

			<h2 style="margin-top: 28px;">تنظیم لازم در WooCommerce</h2>
			<ol style="max-width: 920px;">
				<li>از مسیر <strong>WooCommerce ← پیکربندی ← پیشرفته ← REST API</strong> یک کلید بساز.</li>
				<li>کاربر کلید را مدیر یا مدیر فروشگاه انتخاب کن و سطح دسترسی را روی <strong>Read/Write</strong> بگذار.</li>
				<li>Consumer Key و Consumer Secret را فقط در Environment Variables پروژه CMS قرار بده.</li>
				<li>مقدار <code>WORDPRESS_URL</code> باید آدرس HTTPS وردپرس و بدون <code>/wp-json</code> باشد.</li>
			</ol>

			<p><strong>نکته:</strong> بازکردن endpoint در مرورگر بدون کلید REST باید خطای 401 بدهد؛ این رفتار صحیح و امن است.</p>
		</div>
		<?php
	}
}
