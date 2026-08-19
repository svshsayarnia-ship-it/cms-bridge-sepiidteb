<?php
/**
 * Razban SMS OTP provider adapter for Sepiid Beauty.
 *
 * Razban's public documentation confirms HTTPS, an account token and an
 * approved pattern for OTP, while the concrete endpoint/payload contract is
 * supplied inside their customer/developer documentation. This adapter keeps
 * that transport configurable so no provider secret or guessed API contract is
 * committed to source control.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

final class Razban_Otp_Provider {
	/** @return void */
	public function hooks() {
		// Run before the Kavenegar adapter. A non-null result prevents fall-through.
		add_filter( 'sepiid_send_otp_sms', array( $this, 'send' ), 5, 4 );
	}

	/**
	 * @param mixed  $result  Previous provider result.
	 * @param string $phone   Canonical Iranian mobile number.
	 * @param string $code    Six-digit OTP.
	 * @param string $purpose login|register.
	 * @return mixed|\WP_Error
	 */
	public function send( $result, $phone, $code, $purpose ) {
		if ( null !== $result ) {
			return $result;
		}

		$provider = strtolower( $this->config_value( 'SEPIID_SMS_PROVIDER', 'kavenegar' ) );
		if ( 'razban' !== $provider ) {
			return $result;
		}

		$config = array(
			'api_url'       => $this->config_value( 'SEPIID_RAZBAN_API_URL' ),
			'api_token'     => $this->config_value( 'SEPIID_RAZBAN_API_TOKEN' ),
			'pattern'       => $this->config_value( 'SEPIID_RAZBAN_PATTERN' ),
			'auth_header'   => $this->config_value( 'SEPIID_RAZBAN_AUTH_HEADER', 'Authorization' ),
			'auth_prefix'   => $this->config_value( 'SEPIID_RAZBAN_AUTH_PREFIX', 'Bearer ' ),
			'phone_field'   => $this->config_value( 'SEPIID_RAZBAN_PHONE_FIELD' ),
			'code_field'    => $this->config_value( 'SEPIID_RAZBAN_CODE_FIELD' ),
			'pattern_field' => $this->config_value( 'SEPIID_RAZBAN_PATTERN_FIELD' ),
		);

		// Allow an official Razban plugin or a future exact transport mapping to
		// take over without changing the OTP/session architecture.
		$filtered = apply_filters( 'sepiid_razban_otp_transport', null, $phone, $code, $purpose, $config );
		if ( true === $filtered || is_wp_error( $filtered ) ) {
			return $filtered;
		}
		if ( false === $filtered ) {
			return $this->error( 'sepiid_razban_failed', 'ارسال کد از سرویس رازبان انجام نشد.' );
		}

		$required = array( 'api_url', 'api_token', 'pattern', 'phone_field', 'code_field', 'pattern_field' );
		foreach ( $required as $key ) {
			if ( empty( $config[ $key ] ) ) {
				return $this->error(
					'sepiid_razban_not_configured',
					'اتصال رازبان هنوز کامل تنظیم نشده است. مشخصات API و پترن را روی وردپرس وارد کن.'
				);
			}
		}

		if ( 0 !== strpos( $config['api_url'], 'https://' ) ) {
			return $this->error( 'sepiid_razban_invalid_endpoint', 'آدرس API رازبان باید HTTPS باشد.' );
		}

		$payload = array(
			$config['phone_field']   => $phone,
			$config['code_field']    => $code,
			$config['pattern_field'] => $config['pattern'],
		);

		$extra_payload = $this->config_value( 'SEPIID_RAZBAN_EXTRA_PAYLOAD_JSON' );
		if ( $extra_payload ) {
			$decoded = json_decode( $extra_payload, true );
			if ( is_array( $decoded ) ) {
				$payload = array_merge( $decoded, $payload );
			}
		}

		$headers = array(
			'Accept'       => 'application/json',
			'Content-Type' => 'application/json; charset=utf-8',
		);
		$headers[ $config['auth_header'] ] = $config['auth_prefix'] . $config['api_token'];

		$response = wp_remote_post(
			$config['api_url'],
			array(
				'timeout'     => 8,
				'redirection' => 0,
				'headers'     => $headers,
				'body'        => wp_json_encode( $payload ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $this->error( 'sepiid_razban_unavailable', 'ارتباط با سرویس پیامک رازبان برقرار نشد.' );
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		if ( $status < 200 || $status >= 300 ) {
			return $this->error( 'sepiid_razban_failed', 'رازبان درخواست ارسال کد را نپذیرفت. تنظیمات API یا پترن را بررسی کن.' );
		}

		return true;
	}

	/** @return string */
	private function config_value( $name, $default = '' ) {
		if ( defined( $name ) ) {
			return trim( (string) constant( $name ) );
		}
		$value = getenv( $name );
		if ( false === $value || '' === trim( (string) $value ) ) {
			return $default;
		}
		return trim( (string) $value );
	}

	/** @return \WP_Error */
	private function error( $code, $message ) {
		return new \WP_Error( $code, $message, array( 'status' => 503 ) );
	}
}
