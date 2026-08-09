<?php
/** Editable storefront presentation REST endpoint. @package SepiidProductBridge */
namespace Sepiid\ProductBridge;
defined( 'ABSPATH' ) || exit;

final class Site_Presentation_Controller {
	const REST_NAMESPACE = 'wc/v3';
	const OPTION_KEY = 'sepiid_site_presentation_v1';
	public function hooks() { add_action( 'rest_api_init', array( $this, 'register_routes' ) ); }
	public function register_routes() {
		register_rest_route( self::REST_NAMESPACE, '/sepiid-site-presentation', array(
			array( 'methods' => \WP_REST_Server::READABLE, 'callback' => array( $this, 'get_presentation' ), 'permission_callback' => array( $this, 'check_permissions' ) ),
			array( 'methods' => \WP_REST_Server::EDITABLE, 'callback' => array( $this, 'update_presentation' ), 'permission_callback' => array( $this, 'check_permissions' ) ),
		) );
	}
	public function check_permissions() {
		if ( ! get_current_user_id() ) return new \WP_Error( 'sepiid_presentation_auth_required', 'کلید معتبر WooCommerce لازم است.', array( 'status' => 401 ) );
		if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'edit_products' ) ) return new \WP_Error( 'sepiid_presentation_permission_required', 'اجازه مدیریت محتوای سایت وجود ندارد.', array( 'status' => 403 ) );
		return true;
	}
	public function get_presentation() {
		$value = get_option( self::OPTION_KEY, null );
		$response = new \WP_REST_Response( array( 'exists' => is_array( $value ), 'presentation' => is_array( $value ) ? $value : null ), 200 );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}
	public function update_presentation( $request ) {
		$value = $request->get_json_params();
		if ( ! is_array( $value ) || empty( $value['header'] ) || empty( $value['footer'] ) || empty( $value['home']['hero'] ) || ! isset( $value['articles'] ) ) {
			return new \WP_Error( 'sepiid_presentation_invalid_payload', 'ساختار محتوای سایت کامل نیست.', array( 'status' => 400 ) );
		}
		$value = $this->sanitize_value( $value, 0, '' );
		if ( is_wp_error( $value ) ) return $value;
		update_option( self::OPTION_KEY, $value, false );
		return new \WP_REST_Response( array( 'saved' => true, 'presentation' => $value ), 200 );
	}
	private function sanitize_value( $value, $depth, $field ) {
		if ( $depth > 8 ) return new \WP_Error( 'sepiid_presentation_too_deep', 'ساختار محتوا بیش از حد تو در تو است.', array( 'status' => 400 ) );
		if ( is_array( $value ) ) {
			$output = array();
			foreach ( array_slice( $value, 0, 100, true ) as $key => $item ) {
				if ( ! is_int( $key ) && ! preg_match( '/^[A-Za-z][A-Za-z0-9]*$/', (string) $key ) ) continue;
				$clean_key = is_int( $key ) ? $key : (string) $key;
				$clean = $this->sanitize_value( $item, $depth + 1, (string) $clean_key );
				if ( is_wp_error( $clean ) ) return $clean;
				$output[ $clean_key ] = $clean;
			}
			return $output;
		}
		if ( is_bool( $value ) || is_numeric( $value ) ) return $value;
		$text = trim( wp_strip_all_tags( (string) $value ) );
		if ( in_array( $field, array( 'href', 'primaryCtaHref', 'secondaryCtaHref', 'image' ), true ) ) {
			if ( 0 === strpos( $text, '/' ) && 0 !== strpos( $text, '//' ) ) return $text;
			$url = esc_url_raw( $text, array( 'https' ) );
			if ( ! $url ) return new \WP_Error( 'sepiid_presentation_invalid_url', 'یکی از لینک‌ها یا تصاویر معتبر نیست.', array( 'status' => 400 ) );
			return $url;
		}
		return function_exists( 'mb_substr' ) ? mb_substr( $text, 0, 12000 ) : substr( $text, 0, 12000 );
	}
}
