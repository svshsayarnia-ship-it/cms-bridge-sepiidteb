<?php
/**
 * Direct Kavenegar SMS provider for Sepiid Beauty customer OTP codes.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

final class Kavenegar_Direct_Otp_Provider {
	const DEFAULT_SENDER = '2000660110';

	/** @return void */
	public function hooks() {
		add_filter( 'sepiid_send_otp_sms', array( $this, 'send' ), 10, 4 );
	}

	/**
	 * Send an OTP through Kavenegar's regular SMS Send API.
	 *
	 * This provider intentionally keeps the API key outside source control. The
	 * key must be supplied through SEPIID_KAVENEGAR_API_KEY as a wp-config.php
	 * constant or server environment variable. The sender may be overridden with
	 * SEPIID_KAVENEGAR_SENDER; otherwise Sepiid Beauty's configured sender is used.
	 *
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

		$api_key = $this->config_value( 'SEPIID_KAVENEGAR_API_KEY' );
		if ( ! $api_key ) {
			return $this->error(
				'sepiid_sms_not_configured',
				'کلید API سرویس پیامک هنوز روی وردپرس تنظیم نشده است.'
			);
		}

		$sender = $this->config_value( 'SEPIID_KAVENEGAR_SENDER' );
		if ( ! $sender ) {
			$sender = self::DEFAULT_SENDER;
		}

		$message = sprintf(
			"کد تأیید سپید بیوتی: %s\nاعتبار: ۳ دقیقه",
			(string) $code
		);
		$message = (string) apply_filters( 'sepiid_otp_sms_message', $message, $code, $purpose, $phone );

		$url = 'https://api.kavenegar.com/v1/' . rawurlencode( $api_key ) . '/sms/send.json';
		$response = wp_remote_post(
			$url,
			array(
				'timeout'     => 8,
				'redirection' => 2,
				'headers'     => array( 'Accept' => 'application/json' ),
				'body'        => array(
					'receptor' => $phone,
					'sender'   => $sender,
					'message'  => $message,
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $this->error(
				'sepiid_sms_unavailable',
				'ارتباط با سرویس پیامک برقرار نشد. دوباره تلاش کن.'
			);
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		$provider_status = isset( $body['return']['status'] ) ? (int) $body['return']['status'] : 0;

		if ( $status < 200 || $status >= 300 || 200 !== $provider_status ) {
			return $this->error(
				'sepiid_sms_failed',
				'ارسال کد پیامکی انجام نشد. تنظیمات خط ارسال یا اعتبار کاوه‌نگار را بررسی کن.'
			);
		}

		return true;
	}

	/** @return string */
	private function config_value( $name ) {
		if ( defined( $name ) ) {
			return trim( (string) constant( $name ) );
		}
		$value = getenv( $name );
		return false === $value ? '' : trim( (string) $value );
	}

	/** @return \WP_Error */
	private function error( $code, $message ) {
		return new \WP_Error( $code, $message, array( 'status' => 503 ) );
	}
}
