<?php
/**
 * REST endpoints for editable storefront presentation content.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

/**
 * Stores presentation content in WordPress without mixing it
 * with WooCommerce product or category data.
 */
final class Site_Presentation_Controller {

	const REST_NAMESPACE = 'wc/v3';
	const OPTION_KEY     = 'sepiid_site_presentation_v1';

	/**
	 * Register WordPress hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action(
			'rest_api_init',
			array( $this, 'register_routes' )
		);
	}

	/**
	 * Register the presentation endpoint.
	 *
	 * GET  /wp-json/wc/v3/sepiid-site-presentation
	 * PUT  /wp-json/wc/v3/sepiid-site-presentation
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/sepiid-site-presentation',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array(
						$this,
						'get_presentation',
					),
					'permission_callback' => array(
						$this,
						'check_permissions',
					),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array(
						$this,
						'update_presentation',
					),
					'permission_callback' => array(
						$this,
						'check_permissions',
					),
				),
			)
		);
	}

	/**
	 * Only an authenticated WooCommerce manager may
	 * read or change presentation settings.
	 *
	 * @return true|\WP_Error
	 */
	public function check_permissions() {
		if ( ! get_current_user_id() ) {
			return new \WP_Error(
				'sepiid_presentation_auth_required',
				'برای مدیریت ظاهر سایت یک کلید معتبر WooCommerce لازم است.',
				array(
					'status' => 401,
				)
			);
		}

		if (
			! current_user_can( 'manage_woocommerce' ) &&
			! current_user_can( 'edit_products' )
		) {
			return new \WP_Error(
				'sepiid_presentation_permission_required',
				'این حساب اجازه مدیریت ظاهر سایت را ندارد.',
				array(
					'status' => 403,
				)
			);
		}

		return true;
	}

	/**
	 * Read saved presentation data.
	 *
	 * When nothing has been saved yet, the CMS receives null
	 * and can safely fall back to its code-defined defaults.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_presentation() {
		$presentation = get_option(
			self::OPTION_KEY,
			null
		);

		if ( ! is_array( $presentation ) ) {
			$presentation = null;
		}

		$response = new \WP_REST_Response(
			array(
				'exists'       => null !== $presentation,
				'presentation' => $presentation,
			),
			200
		);

		$response->header(
			'Cache-Control',
			'no-store, no-cache, must-revalidate, max-age=0'
		);

		return $response;
	}

	/**
	 * Save presentation data.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_presentation( $request ) {
		$payload = $request->get_json_params();

		if ( ! is_array( $payload ) ) {
			return new \WP_Error(
				'sepiid_presentation_invalid_payload',
				'ساختار اطلاعات ظاهر سایت معتبر نیست.',
				array(
					'status' => 400,
				)
			);
		}

		$presentation =
			$this->sanitize_presentation(
				$payload
			);

		if ( is_wp_error( $presentation ) ) {
			return $presentation;
		}

		update_option(
			self::OPTION_KEY,
			$presentation,
			false
		);

		$response = new \WP_REST_Response(
			array(
				'saved'        => true,
				'presentation' => $presentation,
			),
			200
		);

		$response->header(
			'Cache-Control',
			'no-store, no-cache, must-revalidate, max-age=0'
		);

		return $response;
	}

	/**
	 * Validate and sanitize the supported presentation contract.
	 *
	 * @param array $payload Incoming JSON.
	 * @return array|\WP_Error
	 */
	private function sanitize_presentation( $payload ) {
		if (
			empty( $payload['home'] ) ||
			! is_array( $payload['home'] ) ||
			empty( $payload['home']['hero'] ) ||
			! is_array( $payload['home']['hero'] )
		) {
			return new \WP_Error(
				'sepiid_presentation_missing_home_hero',
				'اطلاعات Hero صفحه اصلی کامل نیست.',
				array(
					'status' => 400,
				)
			);
		}

		$hero = $payload['home']['hero'];

		$required_fields = array(
			'eyebrow',
			'title',
			'description',
			'primaryCtaLabel',
			'primaryCtaHref',
			'secondaryCtaLabel',
			'secondaryCtaHref',
			'microproofItems',
			'image',
			'imageAlt',
			'editorialLabel',
			'editorialCaption',
			'qualityTitle',
			'qualitySubtitle',
		);

		foreach ( $required_fields as $field ) {
			if ( ! array_key_exists( $field, $hero ) ) {
				return new \WP_Error(
					'sepiid_presentation_missing_field',
					sprintf(
						'فیلد %s در تنظیمات Hero وجود ندارد.',
						$field
					),
					array(
						'status' => 400,
					)
				);
			}
		}

		if ( ! is_array( $hero['microproofItems'] ) ) {
			return new \WP_Error(
				'sepiid_presentation_invalid_microproof',
				'آیتم‌های اعتماد Hero باید به‌صورت فهرست ارسال شوند.',
				array(
					'status' => 400,
				)
			);
		}

		$microproof_items = array();

		foreach (
			array_slice(
				$hero['microproofItems'],
				0,
				6
			) as $item
		) {
			$clean_item = $this->clean_text(
				$item,
				120
			);

			if ( '' !== $clean_item ) {
				$microproof_items[] =
					$clean_item;
			}
		}

		$primary_href =
			$this->clean_url_or_path(
				$hero['primaryCtaHref']
			);

		$secondary_href =
			$this->clean_url_or_path(
				$hero['secondaryCtaHref']
			);

		$image =
			$this->clean_url_or_path(
				$hero['image']
			);

		if (
			'' === $primary_href ||
			'' === $secondary_href ||
			'' === $image
		) {
			return new \WP_Error(
				'sepiid_presentation_invalid_url',
				'آدرس تصویر یا لینک‌های Hero معتبر نیستند.',
				array(
					'status' => 400,
				)
			);
		}

		return array(
			'home' => array(
				'hero' => array(
					'eyebrow' =>
						$this->clean_text(
							$hero['eyebrow'],
							180
						),

					'title' =>
						$this->clean_text(
							$hero['title'],
							220
						),

					'description' =>
						$this->clean_text(
							$hero['description'],
							500
						),

					'primaryCtaLabel' =>
						$this->clean_text(
							$hero['primaryCtaLabel'],
							100
						),

					'primaryCtaHref' =>
						$primary_href,

					'secondaryCtaLabel' =>
						$this->clean_text(
							$hero['secondaryCtaLabel'],
							100
						),

					'secondaryCtaHref' =>
						$secondary_href,

					'microproofItems' =>
						$microproof_items,

					'image' =>
						$image,

					'imageAlt' =>
						$this->clean_text(
							$hero['imageAlt'],
							250
						),

					'editorialLabel' =>
						$this->clean_text(
							$hero['editorialLabel'],
							120
						),

					'editorialCaption' =>
						$this->clean_text(
							$hero['editorialCaption'],
							180
						),

					'qualityTitle' =>
						$this->clean_text(
							$hero['qualityTitle'],
							140
						),

					'qualitySubtitle' =>
						$this->clean_text(
							$hero['qualitySubtitle'],
							140
						),
				),
			),
		);
	}

	/**
	 * Sanitize plain presentation text and enforce a safe length.
	 *
	 * @param mixed $value Value.
	 * @param int   $max_length Maximum length.
	 * @return string
	 */
	private function clean_text(
		$value,
		$max_length
	) {
		$value = trim(
			wp_strip_all_tags(
				(string) $value
			)
		);

		if (
			function_exists( 'mb_substr' )
		) {
			return mb_substr(
				$value,
				0,
				$max_length
			);
		}

		return substr(
			$value,
			0,
			$max_length
		);
	}

	/**
	 * Allow secure absolute URLs and internal site paths.
	 *
	 * @param mixed $value URL or path.
	 * @return string
	 */
	private function clean_url_or_path( $value ) {
		$value = trim(
			(string) $value
		);

		if ( '' === $value ) {
			return '';
		}

		if (
			0 === strpos( $value, '/' ) &&
			0 !== strpos( $value, '//' )
		) {
			return '/' . ltrim(
				sanitize_text_field( $value ),
				'/'
			);
		}

		$url = esc_url_raw(
			$value,
			array(
				'http',
				'https',
			)
		);

		return is_string( $url )
			? $url
			: '';
	}
}