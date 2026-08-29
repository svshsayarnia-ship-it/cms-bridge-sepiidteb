<?php
/**
 * Mobile OTP login and canonical phone uniqueness for Sepiid Beauty customers.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

final class Customer_Otp_Controller {
	const REST_NAMESPACE = 'sepiid/v1';
	const OTP_TTL        = 180;
	const OTP_ATTEMPTS   = 5;
	const PROOF_TTL      = 600;
	const SMS_COOLDOWN   = 60;
	const SMS_LIMIT      = 5;
	const SMS_WINDOW     = 900;
	const MAX_SESSIONS   = 5;
	const SESSION_TTL    = 2592000;

	/** @var string */
	private $session_table;

	/** @var string */
	private $registration_lock_key = '';

	/** @var string */
	private $registration_proof_key = '';

	public function __construct() {
		global $wpdb;
		$this->session_table = $wpdb->prefix . 'sepiid_customer_sessions';
	}

	/** @return void */
	public function hooks() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_filter( 'rest_pre_dispatch', array( $this, 'guard_customer_routes' ), 10, 3 );
		add_filter( 'rest_post_dispatch', array( $this, 'finalize_customer_routes' ), 10, 3 );
		add_action( 'init', array( $this, 'maybe_backfill_phone_index' ), 20 );
	}

	/** @return void */
	public function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/auth/otp/request',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'request_otp' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/auth/otp/verify',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'verify_otp' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Enforce phone uniqueness and require a verified phone proof for registration.
	 * Password-based customer login is deliberately disabled so mobile login cannot
	 * bypass OTP.
	 *
	 * @param mixed            $result Existing result.
	 * @param \WP_REST_Server  $server REST server.
	 * @param \WP_REST_Request $request Request.
	 * @return mixed
	 */
	public function guard_customer_routes( $result, $server, $request ) {
		unset( $server );
		if ( null !== $result ) {
			return $result;
		}

		$route = $request->get_route();
		if ( '/sepiid/v1/auth/login' === $route ) {
			return $this->error(
				'sepiid_sms_login_required',
				'ورود با رمز ثابت غیرفعال است. کد یک‌بارمصرف پیامکی درخواست کن.',
				403
			);
		}

		if ( ! in_array( $route, array( '/sepiid/v1/auth/register', '/sepiid/v1/auth/profile' ), true ) ) {
			return $result;
		}

		$phone = $this->normalize_phone( (string) $request->get_param( 'phone' ) );
		if ( ! $this->is_valid_phone( $phone ) ) {
			return $this->error( 'sepiid_invalid_phone', 'شماره موبایل معتبر وارد کن.', 400 );
		}

		$matches = $this->find_users_by_phone( $phone );
		if ( '/sepiid/v1/auth/profile' === $route ) {
			$session_user_id = $this->session_user_id( $request );
			foreach ( $matches as $user ) {
				if ( ! $session_user_id || (int) $user->ID !== $session_user_id ) {
					return $this->error( 'sepiid_phone_in_use', 'این شماره موبایل قبلاً برای حساب دیگری ثبت شده است.', 409 );
				}
			}
			return $result;
		}

		if ( ! empty( $matches ) ) {
			return $this->error( 'sepiid_phone_in_use', 'با این شماره موبایل قبلاً عضویت انجام شده است. وارد حساب موجود شو.', 409 );
		}

		$proof = sanitize_text_field( (string) $request->get_param( 'phoneProof' ) );
		$proof_key = $this->phone_proof_key( $proof );
		$proof_data = $proof_key ? get_transient( $proof_key ) : false;
		if (
			! is_array( $proof_data ) ||
			empty( $proof_data['phone'] ) ||
			! hash_equals( $phone, (string) $proof_data['phone'] ) ||
			empty( $proof_data['expires'] ) ||
			(int) $proof_data['expires'] < time()
		) {
			return $this->error( 'sepiid_phone_verification_required', 'قبل از عضویت، شماره موبایل را با کد پیامکی تأیید کن.', 403 );
		}

		$lock_key = 'sepiid_phone_lock_' . hash( 'sha256', $phone );
		if ( ! $this->acquire_lock( $lock_key ) ) {
			return $this->error( 'sepiid_phone_registration_busy', 'ثبت این شماره در حال انجام است. چند لحظه بعد دوباره امتحان کن.', 409 );
		}

		$this->registration_lock_key = $lock_key;
		$this->registration_proof_key = $proof_key;
		return $result;
	}

	/**
	 * Release the registration lock, consume successful verification proof and
	 * persist the normalized phone index after successful profile writes.
	 *
	 * @param mixed            $response Response.
	 * @param \WP_REST_Server  $server REST server.
	 * @param \WP_REST_Request $request Request.
	 * @return mixed
	 */
	public function finalize_customer_routes( $response, $server, $request ) {
		unset( $server );
		$route = $request->get_route();
		$status = is_object( $response ) && method_exists( $response, 'get_status' ) ? (int) $response->get_status() : 500;

		if ( '/sepiid/v1/auth/register' === $route ) {
			if ( $status >= 200 && $status < 300 ) {
				if ( $this->registration_proof_key ) {
					delete_transient( $this->registration_proof_key );
				}
				$this->index_response_phone( $response, $request );
			}
			if ( $this->registration_lock_key ) {
				delete_option( $this->registration_lock_key );
			}
			$this->registration_lock_key = '';
			$this->registration_proof_key = '';
		}

		if ( '/sepiid/v1/auth/profile' === $route && $status >= 200 && $status < 300 ) {
			$this->index_response_phone( $response, $request );
		}
		return $response;
	}

	/**
	 * Request a short-lived SMS OTP for login or registration.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function request_otp( $request ) {
		$phone = $this->normalize_phone( (string) $request->get_param( 'phone' ) );
		$purpose = sanitize_key( (string) $request->get_param( 'purpose' ) );
		$purpose = in_array( $purpose, array( 'login', 'register' ), true ) ? $purpose : 'login';

		if ( ! $this->is_valid_phone( $phone ) ) {
			return $this->error( 'sepiid_invalid_phone', 'شماره موبایل معتبر وارد کن.', 400 );
		}

		$rate = $this->rate_limit( 'otp-sms', $phone, self::SMS_LIMIT, self::SMS_WINDOW );
		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		$cooldown_key = 'sepiid_otp_cd_' . hash( 'sha256', $phone );
		if ( get_transient( $cooldown_key ) ) {
			return $this->error( 'sepiid_otp_cooldown', 'برای درخواست کد جدید کمی صبر کن.', 429 );
		}

		$matches = $this->find_users_by_phone( $phone );
		if ( 'register' === $purpose && ! empty( $matches ) ) {
			return $this->error( 'sepiid_phone_in_use', 'با این شماره موبایل قبلاً عضویت انجام شده است.', 409 );
		}
		if ( 'login' === $purpose && count( $matches ) > 1 ) {
			return $this->error( 'sepiid_phone_conflict', 'این شماره روی بیش از یک حساب قدیمی ثبت شده است. برای ادغام حساب‌ها با پشتیبانی تماس بگیر.', 409 );
		}

		$challenge = $this->base64url( random_bytes( 24 ) );
		$code = (string) random_int( 100000, 999999 );
		$user_id = 'login' === $purpose && ! empty( $matches ) ? (int) $matches[0]->ID : 0;
		$data = array(
			'phone'     => $phone,
			'purpose'   => $purpose,
			'user_id'   => $user_id,
			'code_hash' => $this->otp_hash( $code, $phone, $challenge ),
			'attempts'  => self::OTP_ATTEMPTS,
			'expires'   => time() + self::OTP_TTL,
		);
		set_transient( $this->otp_key( $challenge ), $data, self::OTP_TTL );

		if ( 'register' === $purpose || $user_id > 0 ) {
			$sent = $this->send_otp_sms( $phone, $code, $purpose );
			if ( is_wp_error( $sent ) ) {
				delete_transient( $this->otp_key( $challenge ) );
				return $sent;
			}
		}

		set_transient( $cooldown_key, 1, self::SMS_COOLDOWN );
		return $this->success(
			array(
				'challenge' => $challenge,
				'expiresIn' => self::OTP_TTL,
				'message'   => 'اگر شماره برای این عملیات معتبر باشد، کد ورود پیامک شد.',
			)
		);
	}

	/**
	 * Verify OTP. Login returns a customer session; registration returns a
	 * short-lived proof that must accompany the create-account request.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function verify_otp( $request ) {
		$challenge = sanitize_text_field( (string) $request->get_param( 'challenge' ) );
		$code = preg_replace( '/\D+/', '', (string) $request->get_param( 'code' ) );
		$purpose = sanitize_key( (string) $request->get_param( 'purpose' ) );
		$purpose = in_array( $purpose, array( 'login', 'register' ), true ) ? $purpose : 'login';

		if ( ! preg_match( '/^[A-Za-z0-9_-]{24,64}$/', $challenge ) || ! preg_match( '/^\d{6}$/', $code ) ) {
			return $this->invalid_otp();
		}

		$key = $this->otp_key( $challenge );
		$data = get_transient( $key );
		if (
			! is_array( $data ) ||
			empty( $data['phone'] ) ||
			empty( $data['purpose'] ) ||
			! hash_equals( $purpose, (string) $data['purpose'] ) ||
			empty( $data['expires'] ) ||
			(int) $data['expires'] < time()
		) {
			delete_transient( $key );
			return $this->invalid_otp();
		}

		$attempts = isset( $data['attempts'] ) ? (int) $data['attempts'] : 0;
		if ( $attempts <= 0 ) {
			delete_transient( $key );
			return $this->invalid_otp();
		}

		$expected = $this->otp_hash( $code, (string) $data['phone'], $challenge );
		if ( empty( $data['code_hash'] ) || ! hash_equals( (string) $data['code_hash'], $expected ) ) {
			$data['attempts'] = $attempts - 1;
			if ( $data['attempts'] <= 0 ) {
				delete_transient( $key );
			} else {
				$ttl = max( 1, (int) $data['expires'] - time() );
				set_transient( $key, $data, $ttl );
			}
			return $this->invalid_otp();
		}

		delete_transient( $key );
		if ( 'register' === $purpose ) {
			if ( ! empty( $this->find_users_by_phone( (string) $data['phone'] ) ) ) {
				return $this->error( 'sepiid_phone_in_use', 'با این شماره موبایل قبلاً عضویت انجام شده است.', 409 );
			}
			$proof = $this->base64url( random_bytes( 32 ) );
			set_transient(
				$this->phone_proof_key( $proof ),
				array(
					'phone'   => (string) $data['phone'],
					'expires' => time() + self::PROOF_TTL,
				),
				self::PROOF_TTL
			);
			return $this->success(
				array(
					'phoneProof' => $proof,
					'expiresIn'  => self::PROOF_TTL,
				)
			);
		}

		$user = ! empty( $data['user_id'] ) ? get_user_by( 'id', (int) $data['user_id'] ) : false;
		if ( ! $user ) {
			return $this->invalid_otp();
		}

		// Successful OTP verification proves ownership of the number. Persist the
		// canonical value so legacy accounts that used the phone as user_login are
		// indexed by the current account system from this point forward.
		$verified_phone = $this->normalize_phone( (string) $data['phone'] );
		if ( $this->is_valid_phone( $verified_phone ) ) {
			update_user_meta( (int) $user->ID, 'billing_phone', $verified_phone );
			update_user_meta( (int) $user->ID, 'sepiid_phone_normalized', $verified_phone );
		}

		return $this->success(
			array(
				'token' => $this->create_session( $user, $request ),
				'user'  => $this->public_user( $user ),
			)
		);
	}

	/** @return void */
	public function maybe_backfill_phone_index() {
		if ( '1' === (string) get_option( 'sepiid_phone_index_v1', '' ) ) {
			return;
		}
		global $wpdb;
		$rows = $wpdb->get_results(
			"SELECT user_id, meta_value FROM {$wpdb->usermeta} WHERE meta_key = 'billing_phone' AND meta_value <> ''"
		);
		foreach ( $rows as $row ) {
			$phone = $this->normalize_phone( (string) $row->meta_value );
			if ( $this->is_valid_phone( $phone ) ) {
				update_user_meta( (int) $row->user_id, 'sepiid_phone_normalized', $phone );
			}
		}
		update_option( 'sepiid_phone_index_v1', '1', false );
	}

	/** @return void */
	private function index_response_phone( $response, $request ) {
		if ( ! is_object( $response ) || ! method_exists( $response, 'get_data' ) ) {
			return;
		}
		$data = $response->get_data();
		$user_id = isset( $data['user']['id'] ) ? (int) $data['user']['id'] : 0;
		$phone = $this->normalize_phone( (string) $request->get_param( 'phone' ) );
		if ( $user_id && $this->is_valid_phone( $phone ) ) {
			update_user_meta( $user_id, 'billing_phone', $phone );
			update_user_meta( $user_id, 'sepiid_phone_normalized', $phone );
		}
	}

	/**
	 * @param string $phone Canonical phone.
	 * @return \WP_User[]
	 */
	private function find_users_by_phone( $phone ) {
		$matched = array();

		// Older WooCommerce/SMS setups commonly stored the mobile number as the
		// WordPress username without also populating billing_phone. Keep those
		// accounts login-compatible across the common Iranian number formats.
		foreach ( $this->legacy_phone_login_candidates( $phone ) as $login ) {
			$user = get_user_by( 'login', $login );
			if ( $user ) {
				$matched[ (int) $user->ID ] = $user;
			}
		}

		$indexed = get_users(
			array(
				'number'      => 10,
				'count_total' => false,
				'meta_key'    => 'sepiid_phone_normalized',
				'meta_value'  => $phone,
			)
		);
		foreach ( $indexed as $user ) {
			$matched[ (int) $user->ID ] = $user;
		}

		global $wpdb;
		$rows = $wpdb->get_results(
			"SELECT user_id, meta_value FROM {$wpdb->usermeta} WHERE meta_key = 'billing_phone' AND meta_value <> ''"
		);
		foreach ( $rows as $row ) {
			if ( ! hash_equals( $phone, $this->normalize_phone( (string) $row->meta_value ) ) ) {
				continue;
			}
			$user = get_user_by( 'id', (int) $row->user_id );
			if ( $user ) {
				$matched[ (int) $user->ID ] = $user;
			}
		}
		ksort( $matched, SORT_NUMERIC );
		return array_values( $matched );
	}

	/**
	 * Return historic username forms for a canonical Iranian mobile number.
	 *
	 * @param string $phone Canonical 09xxxxxxxxx phone.
	 * @return string[]
	 */
	private function legacy_phone_login_candidates( $phone ) {
		if ( ! $this->is_valid_phone( $phone ) ) {
			return array();
		}

		$national = substr( $phone, 1 );
		return array_values(
			array_unique(
				array(
					$phone,
					'98' . $national,
					'+98' . $national,
					$national,
				)
			)
		);
	}

	/** @return int */
	private function session_user_id( $request ) {
		$token = trim( (string) $request->get_header( 'x-sepiid-session' ) );
		if ( ! $token ) {
			$authorization = trim( (string) $request->get_header( 'authorization' ) );
			if ( preg_match( '/^Bearer\s+(.+)$/i', $authorization, $matches ) ) {
				$token = trim( $matches[1] );
			}
		}
		if ( ! preg_match( '/^[A-Za-z0-9_-]{40,128}$/', $token ) ) {
			return 0;
		}
		global $wpdb;
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT user_id FROM {$this->session_table} WHERE token_hash = %s AND expires_at > %s LIMIT 1",
				hash( 'sha256', $token ),
				gmdate( 'Y-m-d H:i:s' )
			)
		);
	}

	/** @return bool */
	private function acquire_lock( $key ) {
		$now = time();
		if ( add_option( $key, $now, '', 'no' ) ) {
			return true;
		}
		$created = (int) get_option( $key, 0 );
		if ( $created > 0 && $created < $now - 30 ) {
			delete_option( $key );
			return add_option( $key, $now, '', 'no' );
		}
		return false;
	}

	/** @return true|\WP_Error */
	private function send_otp_sms( $phone, $code, $purpose ) {
		$filtered = apply_filters( 'sepiid_send_otp_sms', null, $phone, $code, $purpose );
		if ( true === $filtered ) {
			return true;
		}
		if ( is_wp_error( $filtered ) ) {
			return $filtered;
		}
		if ( false === $filtered ) {
			return $this->error( 'sepiid_sms_failed', 'ارسال پیامک انجام نشد. دوباره تلاش کن.', 503 );
		}

		$api_key = $this->config_value( 'SEPIID_KAVENEGAR_API_KEY' );
		$template = 'register' === $purpose
			? $this->config_value( 'SEPIID_KAVENEGAR_REGISTER_TEMPLATE' )
			: $this->config_value( 'SEPIID_KAVENEGAR_LOGIN_TEMPLATE' );
		if ( ! $template ) {
			$template = $this->config_value( 'SEPIID_KAVENEGAR_TEMPLATE' );
		}
		if ( ! $api_key || ! $template ) {
			return $this->error( 'sepiid_sms_not_configured', 'سرویس پیامک ورود هنوز تنظیم نشده است.', 503 );
		}

		$url = add_query_arg(
			array(
				'receptor' => $phone,
				'token'    => $code,
				'template' => $template,
			),
			'https://api.kavenegar.com/v1/' . rawurlencode( $api_key ) . '/verify/lookup.json'
		);
		$response = wp_remote_get(
			$url,
			array(
				'timeout'     => 8,
				'redirection' => 2,
				'headers'     => array( 'Accept' => 'application/json' ),
			)
		);
		if ( is_wp_error( $response ) ) {
			return $this->error( 'sepiid_sms_unavailable', 'ارتباط با سرویس پیامک برقرار نشد.', 503 );
		}
		$status = (int) wp_remote_retrieve_response_code( $response );
		$body = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		$provider_status = isset( $body['return']['status'] ) ? (int) $body['return']['status'] : 0;
		if ( $status < 200 || $status >= 300 || 200 !== $provider_status ) {
			return $this->error( 'sepiid_sms_failed', 'ارسال پیامک انجام نشد. دوباره تلاش کن.', 503 );
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

	/** @return string */
	private function normalize_phone( $value ) {
		$value = strtr(
			$value,
			array(
				'۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
				'٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
			)
		);
		$digits = preg_replace( '/\D+/', '', $value );
		if ( 0 === strpos( $digits, '0098' ) ) {
			$digits = '0' . substr( $digits, 4 );
		} elseif ( 0 === strpos( $digits, '98' ) && 12 === strlen( $digits ) ) {
			$digits = '0' . substr( $digits, 2 );
		} elseif ( 10 === strlen( $digits ) && '9' === substr( $digits, 0, 1 ) ) {
			$digits = '0' . $digits;
		}
		return $digits;
	}

	/** @return bool */
	private function is_valid_phone( $phone ) {
		return (bool) preg_match( '/^09\d{9}$/', $phone );
	}

	/** @return string */
	private function otp_hash( $code, $phone, $challenge ) {
		return hash_hmac( 'sha256', $code . '|' . $phone . '|' . $challenge, wp_salt( 'auth' ) );
	}

	/** @return string */
	private function otp_key( $challenge ) {
		return 'sepiid_otp_' . hash( 'sha256', $challenge );
	}

	/** @return string */
	private function phone_proof_key( $proof ) {
		return preg_match( '/^[A-Za-z0-9_-]{40,128}$/', $proof ) ? 'sepiid_phone_proof_' . hash( 'sha256', $proof ) : '';
	}

	/** @return true|\WP_Error */
	private function rate_limit( $bucket, $identity, $limit, $window ) {
		$key = 'sepiid_rl_' . md5( $bucket . '|' . $identity );
		$count = (int) get_transient( $key );
		if ( $count >= $limit ) {
			return $this->error( 'sepiid_rate_limited', 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره امتحان کن.', 429 );
		}
		set_transient( $key, $count + 1, $window );
		return true;
	}

	/** @return string */
	private function create_session( $user, $request ) {
		global $wpdb;
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$this->session_table} WHERE expires_at < %s",
				gmdate( 'Y-m-d H:i:s' )
			)
		);

		$token = $this->base64url( random_bytes( 32 ) );
		$now = gmdate( 'Y-m-d H:i:s' );
		$wpdb->insert(
			$this->session_table,
			array(
				'token_hash'      => hash( 'sha256', $token ),
				'user_id'         => (int) $user->ID,
				'created_at'      => $now,
				'last_seen_at'    => $now,
				'expires_at'      => gmdate( 'Y-m-d H:i:s', time() + self::SESSION_TTL ),
				'user_agent_hash' => $this->fingerprint( (string) $request->get_header( 'user-agent' ) ),
				'ip_hash'         => $this->fingerprint( $this->client_ip() ),
			),
			array( '%s', '%d', '%s', '%s', '%s', '%s', '%s' )
		);

		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT id FROM {$this->session_table} WHERE user_id = %d ORDER BY created_at DESC",
				(int) $user->ID
			)
		);
		foreach ( array_slice( array_map( 'intval', $ids ), self::MAX_SESSIONS ) as $id ) {
			$wpdb->delete( $this->session_table, array( 'id' => $id ), array( '%d' ) );
		}
		return $token;
	}

	/** @return array */
	private function public_user( $user ) {
		$full_name = trim( $user->first_name . ' ' . $user->last_name );
		if ( '' === $full_name ) {
			$full_name = $user->display_name;
		}
		return array(
			'id'          => (int) $user->ID,
			'email'       => (string) $user->user_email,
			'fullName'    => $full_name,
			'phone'       => $this->normalize_phone( (string) get_user_meta( $user->ID, 'billing_phone', true ) ),
			'city'        => (string) get_user_meta( $user->ID, 'billing_city', true ),
			'clinicName'  => (string) get_user_meta( $user->ID, 'sepiid_clinic_name', true ),
			'accountType' => (string) ( get_user_meta( $user->ID, 'sepiid_account_type', true ) ?: 'customer' ),
		);
	}

	/** @return \WP_Error */
	private function invalid_otp() {
		return $this->error( 'sepiid_invalid_otp', 'کد واردشده معتبر نیست یا منقضی شده است.', 401 );
	}

	/** @return string */
	private function client_ip() {
		return isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
	}

	/** @return string */
	private function fingerprint( $value ) {
		return hash_hmac( 'sha256', $value, wp_salt( 'auth' ) );
	}

	/** @return string */
	private function base64url( $bytes ) {
		return rtrim( strtr( base64_encode( $bytes ), '+/', '-_' ), '=' );
	}

	/** @return \WP_REST_Response */
	private function success( $data, $status = 200 ) {
		$response = new \WP_REST_Response( $data, $status );
		$response->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0' );
		$response->header( 'Pragma', 'no-cache' );
		return $response;
	}

	/** @return \WP_Error */
	private function error( $code, $message, $status ) {
		return new \WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
