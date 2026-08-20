<?php
/**
 * Razban SMS OTP provider adapter for Sepiid Beauty.
 *
 * Razban's panel exposes the IPPanel Edge pattern API. This provider keeps all
 * secrets and account-specific identifiers in wp-config.php / environment
 * variables while committing only the public transport contract.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

final class Razban_Otp_Provider {
	const DEFAULT_API_URL = 'https://edge.ippanel.com/v1/api/send';

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
			'api_url'     => $this->config_value( 'SEPIID_RAZBAN_API_URL', self::DEFAULT_API_URL ),
			'api_token'   => $this->config_value( 'SEPIID_RAZBAN_API_TOKEN' ),
			'pattern'     => $this->config_value( 'SEPIID_RAZBAN_PATTERN' ),
			'from_number' => $this->config_value( 'SEPIID_RAZBAN_FROM_NUMBER' ),
			'param_key'   => $this->config_value( 'SEPIID_RAZBAN_PARAM_KEY', 'Code' ),
		);

		// Keep an escape hatch for an official Razban plugin or future API changes
		// without touching the OTP/session architecture.
		$filtered = apply_filters( 'sepiid_razban_otp_transport', null, $phone, $code, $purpose, $config );
		if ( true === $filtered || is_wp_error( $filtered ) ) {
			return $filtered;
		}
		if ( false === $filtered ) {
			return $this->error( 'sepiid_razban_failed', 'ارسال کد از سرویس رازبان انجام نشد.' );
		}

		$required = array( 'api_token', 'pattern', 'from_number', 'param_key' );
		foreach ( $required as $key ) {
			if ( empty( $config[ $key ] ) ) {
				return $this->error(
					'sepiid_razban_not_configured',
					'اتصال رازبان هنوز کامل تنظیم نشده است. توکن، کد پترن و خط ارسال را روی وردپرس وارد کن.'
				);
			}
		}

		if ( 0 !== strpos( $config['api_url'], 'https://' ) ) {
			return $this->error( 'sepiid_razban_invalid_endpoint', 'آدرس API رازبان باید HTTPS باشد.' );
		}

		$recipient = $this->normalize_iran_mobile_e164( $phone );
		if ( '' === $recipient ) {
			return $this->error( 'sepiid_razban_invalid_phone', 'شماره موبایل برای ارسال پیامک معتبر نیست.' );
		}

		$payload = array(
			'sending_type' => 'pattern',
			'from_number'  => $config['from_number'],
			'code'         => $config['pattern'],
			'recipients'   => array( $recipient ),
			'params'       => array(
				$config['param_key'] => (string) $code,
			),
		);

		$response = wp_remote_post(
			$config['api_url'],
			array(
				'timeout'     => 8,
				'redirection' => 0,
				'headers'     => array(
					'Accept'        => 'application/json',
					'Content-Type'  => 'application/json; charset=utf-8',
					'Authorization' => $config['api_token'],
				),
				'body'        => wp_json_encode( $payload ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $this->error( 'sepiid_razban_unavailable', 'ارتباط با سرویس پیامک رازبان برقرار نشد.' );
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		if ( $status < 200 || $status >= 300 ) {
			return new \WP_Error(
				'sepiid_razban_failed',
				'رازبان درخواست ارسال کد را نپذیرفت. وضعیت پترن، توکن و خط ارسال را بررسی کن.',
				array(
					'status'          => 503,
					'provider_status' => $status,
				)
			);
		}

		return true;
	}

	/**
	 * Convert an Iranian mobile number to E.164 (+989xxxxxxxxx).
	 *
	 * @param string $phone Raw/canonical phone value.
	 * @return string
	 */
	private function normalize_iran_mobile_e164( $phone ) {
		$digits = preg_replace( '/\D+/', '', (string) $phone );
		if ( ! is_string( $digits ) ) {
			return '';
		}

		if ( 11 === strlen( $digits ) && 0 === strpos( $digits, '09' ) ) {
			return '+98' . substr( $digits, 1 );
		}
		if ( 12 === strlen( $digits ) && 0 === strpos( $digits, '989' ) ) {
			return '+' . $digits;
		}
		if ( 10 === strlen( $digits ) && 0 === strpos( $digits, '9' ) ) {
			return '+98' . $digits;
		}

		return '';
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
