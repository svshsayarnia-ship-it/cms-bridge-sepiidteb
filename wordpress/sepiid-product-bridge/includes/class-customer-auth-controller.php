<?php
/**
 * Secure customer authentication for Sepiid Beauty.
 *
 * Passwords stay inside WordPress/WooCommerce. The storefront receives only
 * a high-entropy opaque session token and the database stores only its hash.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

final class Customer_Auth_Controller {
	const REST_NAMESPACE = 'sepiid/v1';
	const SCHEMA_VERSION = 1;
	const SESSION_TTL    = 2592000; // 30 days.
	const MAX_SESSIONS   = 5;

	/** @var string */
	private $table_name;

	public function __construct() {
		global $wpdb;
		$this->table_name = $wpdb->prefix . 'sepiid_customer_sessions';
	}

	/** @return void */
	public function hooks() {
		add_action( 'init', array( $this, 'maybe_install' ), 5 );
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/** @return void */
	public function maybe_install() {
		if ( (int) get_option( 'sepiid_customer_auth_schema_version', 0 ) === self::SCHEMA_VERSION ) {
			return;
		}

		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$charset_collate = $wpdb->get_charset_collate();
		$sql = "CREATE TABLE {$this->table_name} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			token_hash char(64) NOT NULL,
			user_id bigint(20) unsigned NOT NULL,
			created_at datetime NOT NULL,
			last_seen_at datetime NOT NULL,
			expires_at datetime NOT NULL,
			user_agent_hash char(64) DEFAULT NULL,
			ip_hash char(64) DEFAULT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY token_hash (token_hash),
			KEY user_id (user_id),
			KEY expires_at (expires_at)
		) {$charset_collate};";

		dbDelta( $sql );
		update_option( 'sepiid_customer_auth_schema_version', self::SCHEMA_VERSION, false );
	}

	/** @return void */
	public function register_routes() {
		$routes = array(
			'/auth/register'         => array( \WP_REST_Server::CREATABLE, 'register_customer' ),
			'/auth/login'            => array( \WP_REST_Server::CREATABLE, 'login' ),
			'/auth/session'          => array( \WP_REST_Server::READABLE, 'session' ),
			'/auth/logout'           => array( \WP_REST_Server::CREATABLE, 'logout' ),
			'/auth/profile'          => array( \WP_REST_Server::EDITABLE, 'update_profile' ),
			'/auth/password/request' => array( \WP_REST_Server::CREATABLE, 'request_password_reset' ),
			'/auth/password/reset'   => array( \WP_REST_Server::CREATABLE, 'reset_password' ),
		);

		foreach ( $routes as $path => $route ) {
			register_rest_route(
				self::REST_NAMESPACE,
				$path,
				array(
					'methods'             => $route[0],
					'callback'            => array( $this, $route[1] ),
					'permission_callback' => '__return_true',
				)
			);
		}
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function register_customer( $request ) {
		$email        = sanitize_email( (string) $request->get_param( 'email' ) );
		$phone        = $this->normalize_phone( (string) $request->get_param( 'phone' ) );
		$full_name    = sanitize_text_field( (string) $request->get_param( 'fullName' ) );
		$password     = (string) $request->get_param( 'password' );
		$city         = sanitize_text_field( (string) $request->get_param( 'city' ) );
		$clinic_name  = sanitize_text_field( (string) $request->get_param( 'clinicName' ) );
		$account_type = $this->safe_account_type( (string) $request->get_param( 'accountType' ) );
		$rate_key     = hash( 'sha256', strtolower( $email ) . '|' . $phone . '|' . $this->client_ip() );
		$rate         = $this->rate_limit( 'register', $rate_key, 5, HOUR_IN_SECONDS );

		if ( is_wp_error( $rate ) ) {
			return $rate;
		}
		if ( ! is_email( $email ) || ! $this->is_valid_phone( $phone ) || '' === trim( $full_name ) ) {
			return $this->error( 'sepiid_invalid_registration', 'اطلاعات ثبت‌نام کامل یا معتبر نیست.', 400 );
		}

		$password_error = $this->password_error( $password );
		if ( $password_error ) {
			return $this->error( 'sepiid_weak_password', $password_error, 400 );
		}
		if ( email_exists( $email ) || $this->find_user_by_phone( $phone ) ) {
			return $this->error( 'sepiid_account_exists', 'برای این ایمیل یا شماره موبایل قبلاً حسابی ثبت شده است.', 409 );
		}

		$user_id = wc_create_new_customer( $email, '', $password );
		if ( is_wp_error( $user_id ) ) {
			return $this->error( 'sepiid_registration_failed', 'ساخت حساب انجام نشد. دوباره تلاش کن.', 400 );
		}

		$this->save_profile( $user_id, $full_name, $phone, $city, $clinic_name, $account_type );
		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			return $this->error( 'sepiid_registration_failed', 'ساخت حساب تکمیل نشد.', 500 );
		}

		return $this->success(
			array(
				'token' => $this->create_session( $user, $request ),
				'user'  => $this->public_user( $user ),
			),
			201
		);
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function login( $request ) {
		$identifier = sanitize_text_field( (string) $request->get_param( 'identifier' ) );
		$password   = (string) $request->get_param( 'password' );
		$rate_key   = hash( 'sha256', strtolower( $identifier ) . '|' . $this->client_ip() );
		$rate       = $this->rate_limit( 'login', $rate_key, 5, 15 * MINUTE_IN_SECONDS );

		if ( is_wp_error( $rate ) ) {
			return $rate;
		}
		if ( '' === trim( $identifier ) || '' === $password ) {
			return $this->invalid_credentials();
		}

		$user = $this->find_user( $identifier );
		if ( ! $user ) {
			$this->fake_password_work( $password );
			return $this->invalid_credentials();
		}

		$authenticated = wp_authenticate( $user->user_login, $password );
		if ( is_wp_error( $authenticated ) ) {
			return $this->invalid_credentials();
		}

		return $this->success(
			array(
				'token' => $this->create_session( $authenticated, $request ),
				'user'  => $this->public_user( $authenticated ),
			)
		);
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function session( $request ) {
		$session = $this->authenticate_session( $request );
		if ( is_wp_error( $session ) ) {
			return $session;
		}
		return $this->success( array( 'user' => $this->public_user( $session['user'] ) ) );
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function logout( $request ) {
		$session = $this->authenticate_session( $request );
		if ( is_wp_error( $session ) ) {
			return $session;
		}

		global $wpdb;
		if ( rest_sanitize_boolean( $request->get_param( 'all' ) ) ) {
			$wpdb->delete( $this->table_name, array( 'user_id' => $session['user']->ID ), array( '%d' ) );
		} else {
			$wpdb->delete( $this->table_name, array( 'token_hash' => $session['token_hash'] ), array( '%s' ) );
		}
		return $this->success( array( 'ok' => true ) );
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_profile( $request ) {
		$session = $this->authenticate_session( $request );
		if ( is_wp_error( $session ) ) {
			return $session;
		}

		$user_id      = (int) $session['user']->ID;
		$full_name    = sanitize_text_field( (string) $request->get_param( 'fullName' ) );
		$phone        = $this->normalize_phone( (string) $request->get_param( 'phone' ) );
		$city         = sanitize_text_field( (string) $request->get_param( 'city' ) );
		$clinic_name  = sanitize_text_field( (string) $request->get_param( 'clinicName' ) );
		$account_type = $this->safe_account_type( (string) $request->get_param( 'accountType' ) );

		if ( '' === trim( $full_name ) || ! $this->is_valid_phone( $phone ) ) {
			return $this->error( 'sepiid_invalid_profile', 'نام و شماره موبایل معتبر لازم است.', 400 );
		}

		$phone_owner = $this->find_user_by_phone( $phone );
		if ( $phone_owner && (int) $phone_owner->ID !== $user_id ) {
			return $this->error( 'sepiid_phone_in_use', 'این شماره موبایل به حساب دیگری متصل است.', 409 );
		}

		$this->save_profile( $user_id, $full_name, $phone, $city, $clinic_name, $account_type );
		$user = get_user_by( 'id', $user_id );
		return $this->success( array( 'user' => $this->public_user( $user ) ) );
	}

	/**
	 * Return the same message whether or not the account exists.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function request_password_reset( $request ) {
		$identifier = sanitize_text_field( (string) $request->get_param( 'identifier' ) );
		$rate_key   = hash( 'sha256', strtolower( $identifier ) . '|' . $this->client_ip() );
		$rate       = $this->rate_limit( 'password-reset', $rate_key, 3, HOUR_IN_SECONDS );
		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		$user = $this->find_user( $identifier );
		if ( $user ) {
			$key = get_password_reset_key( $user );
			if ( ! is_wp_error( $key ) ) {
				$base = untrailingslashit( apply_filters( 'sepiid_storefront_url', 'https://sepiidbeauty.ir' ) );
				$url  = add_query_arg(
					array(
						'key'   => $key,
						'login' => $user->user_login,
					),
					$base . '/account/reset-password'
				);
				wp_mail(
					$user->user_email,
					'بازیابی رمز حساب سپید بیوتی',
					"برای انتخاب رمز جدید، لینک زیر را باز کنید:\n\n" . esc_url_raw( $url ) . "\n\nاگر این درخواست از طرف شما نبوده، آن را نادیده بگیرید."
				);
			}
		}

		return $this->success(
			array( 'message' => 'اگر حسابی با این مشخصات وجود داشته باشد، لینک بازیابی ارسال می‌شود.' )
		);
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function reset_password( $request ) {
		$login    = sanitize_text_field( (string) $request->get_param( 'login' ) );
		$key      = sanitize_text_field( (string) $request->get_param( 'key' ) );
		$password = (string) $request->get_param( 'password' );
		$rate     = $this->rate_limit( 'password-complete', $this->client_ip(), 10, HOUR_IN_SECONDS );
		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		$password_error = $this->password_error( $password );
		if ( $password_error ) {
			return $this->error( 'sepiid_weak_password', $password_error, 400 );
		}

		$user = check_password_reset_key( $key, $login );
		if ( is_wp_error( $user ) ) {
			return $this->error( 'sepiid_invalid_reset', 'لینک بازیابی معتبر نیست یا منقضی شده است.', 400 );
		}

		reset_password( $user, $password );
		global $wpdb;
		$wpdb->delete( $this->table_name, array( 'user_id' => $user->ID ), array( '%d' ) );
		return $this->success( array( 'message' => 'رمز با موفقیت تغییر کرد. حالا دوباره وارد حساب شو.' ) );
	}

	/**
	 * @param int    $user_id User ID.
	 * @param string $full_name Name.
	 * @param string $phone Phone.
	 * @param string $city City.
	 * @param string $clinic_name Clinic.
	 * @param string $account_type Account type.
	 * @return void
	 */
	private function save_profile( $user_id, $full_name, $phone, $city, $clinic_name, $account_type ) {
		$parts      = preg_split( '/\s+/u', trim( $full_name ), 2 );
		$first_name = isset( $parts[0] ) ? $parts[0] : '';
		$last_name  = isset( $parts[1] ) ? $parts[1] : '';

		wp_update_user(
			array(
				'ID'           => $user_id,
				'display_name' => $full_name,
				'first_name'   => $first_name,
				'last_name'    => $last_name,
			)
		);
		update_user_meta( $user_id, 'billing_first_name', $first_name );
		update_user_meta( $user_id, 'billing_last_name', $last_name );
		update_user_meta( $user_id, 'billing_phone', $phone );
		update_user_meta( $user_id, 'sepiid_phone_normalized', $phone );
		update_user_meta( $user_id, 'billing_city', $city );
		update_user_meta( $user_id, 'sepiid_clinic_name', $clinic_name );
		update_user_meta( $user_id, 'sepiid_account_type', $account_type );
	}

	/**
	 * @param \WP_User         $user User.
	 * @param \WP_REST_Request $request Request.
	 * @return string
	 */
	private function create_session( $user, $request ) {
		global $wpdb;
		$this->cleanup_expired_sessions();

		$token      = $this->base64url( random_bytes( 32 ) );
		$token_hash = hash( 'sha256', $token );
		$now        = gmdate( 'Y-m-d H:i:s' );
		$expires    = gmdate( 'Y-m-d H:i:s', time() + self::SESSION_TTL );

		$wpdb->insert(
			$this->table_name,
			array(
				'token_hash'      => $token_hash,
				'user_id'         => $user->ID,
				'created_at'      => $now,
				'last_seen_at'    => $now,
				'expires_at'      => $expires,
				'user_agent_hash' => $this->fingerprint( (string) $request->get_header( 'user-agent' ) ),
				'ip_hash'         => $this->fingerprint( $this->client_ip() ),
			),
			array( '%s', '%d', '%s', '%s', '%s', '%s', '%s' )
		);

		$this->trim_user_sessions( (int) $user->ID );
		return $token;
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return array|\WP_Error
	 */
	private function authenticate_session( $request ) {
		$token = $this->session_token_from_request( $request );
		if ( ! preg_match( '/^[A-Za-z0-9_-]{40,128}$/', $token ) ) {
			return $this->error( 'sepiid_auth_required', 'برای ادامه باید وارد حساب شوی.', 401 );
		}

		global $wpdb;
		$token_hash = hash( 'sha256', $token );
		$row        = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id, user_id, last_seen_at, expires_at FROM {$this->table_name} WHERE token_hash = %s LIMIT 1",
				$token_hash
			)
		);

		if ( ! $row || strtotime( $row->expires_at . ' UTC' ) <= time() ) {
			if ( $row ) {
				$wpdb->delete( $this->table_name, array( 'id' => (int) $row->id ), array( '%d' ) );
			}
			return $this->error( 'sepiid_session_expired', 'نشست کاربری منقضی شده است. دوباره وارد شو.', 401 );
		}

		$user = get_user_by( 'id', (int) $row->user_id );
		if ( ! $user ) {
			$wpdb->delete( $this->table_name, array( 'id' => (int) $row->id ), array( '%d' ) );
			return $this->error( 'sepiid_auth_required', 'نشست کاربری معتبر نیست.', 401 );
		}

		if ( strtotime( $row->last_seen_at . ' UTC' ) < time() - 300 ) {
			$wpdb->update(
				$this->table_name,
				array( 'last_seen_at' => gmdate( 'Y-m-d H:i:s' ) ),
				array( 'id' => (int) $row->id ),
				array( '%s' ),
				array( '%d' )
			);
		}

		return array( 'user' => $user, 'token_hash' => $token_hash );
	}

	/**
	 * @param \WP_User|false $user User.
	 * @return array
	 */
	private function public_user( $user ) {
		if ( ! $user ) {
			return array();
		}
		$full_name = trim( $user->first_name . ' ' . $user->last_name );
		if ( '' === $full_name ) {
			$full_name = $user->display_name;
		}
		return array(
			'id'          => (int) $user->ID,
			'email'       => (string) $user->user_email,
			'fullName'    => $full_name,
			'phone'       => (string) get_user_meta( $user->ID, 'billing_phone', true ),
			'city'        => (string) get_user_meta( $user->ID, 'billing_city', true ),
			'clinicName'  => (string) get_user_meta( $user->ID, 'sepiid_clinic_name', true ),
			'accountType' => (string) ( get_user_meta( $user->ID, 'sepiid_account_type', true ) ?: 'customer' ),
		);
	}

	/**
	 * @param string $identifier Email, login, or phone.
	 * @return \WP_User|false
	 */
	private function find_user( $identifier ) {
		$identifier = trim( $identifier );
		if ( is_email( $identifier ) ) {
			return get_user_by( 'email', sanitize_email( $identifier ) );
		}
		$phone = $this->normalize_phone( $identifier );
		if ( $this->is_valid_phone( $phone ) ) {
			$user = $this->find_user_by_phone( $phone );
			if ( $user ) {
				return $user;
			}
		}
		return get_user_by( 'login', sanitize_user( $identifier, true ) );
	}

	/**
	 * @param string $phone Phone.
	 * @return \WP_User|false
	 */
	private function find_user_by_phone( $phone ) {
		$users = get_users(
			array(
				'number'      => 1,
				'count_total' => false,
				'meta_key'    => 'billing_phone',
				'meta_value'  => $phone,
			)
		);
		return ! empty( $users ) ? $users[0] : false;
	}

	/** @return true|\WP_Error */
	private function rate_limit( $bucket, $identity, $limit, $window ) {
		$key   = 'sepiid_rl_' . md5( $bucket . '|' . $identity );
		$count = (int) get_transient( $key );
		if ( $count >= $limit ) {
			return $this->error( 'sepiid_rate_limited', 'تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کن.', 429 );
		}
		set_transient( $key, $count + 1, $window );
		return true;
	}

	/** @return string|null */
	private function password_error( $password ) {
		if ( strlen( $password ) < 10 ) {
			return 'رمز باید حداقل ۱۰ کاراکتر باشد.';
		}
		$classes  = preg_match( '/[a-z]/', $password ) ? 1 : 0;
		$classes += preg_match( '/[A-Z]/', $password ) ? 1 : 0;
		$classes += preg_match( '/[0-9]/', $password ) ? 1 : 0;
		$classes += preg_match( '/[^A-Za-z0-9]/', $password ) ? 1 : 0;
		return $classes >= 3 ? null : 'رمز را از ترکیب حروف، عدد و نشانه‌ها بساز.';
	}

	/** @return \WP_Error */
	private function invalid_credentials() {
		return $this->error( 'sepiid_invalid_credentials', 'اطلاعات ورود درست نیست.', 401 );
	}

	/** @return void */
	private function fake_password_work( $password ) {
		$hash = password_hash( 'sepiid-invalid-account', PASSWORD_DEFAULT );
		if ( $hash ) {
			password_verify( $password, $hash );
		}
	}

	/** @return string */
	private function safe_account_type( $value ) {
		$value = sanitize_key( $value );
		return in_array( $value, array( 'customer', 'clinic', 'doctor', 'buyer' ), true ) ? $value : 'customer';
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
		}
		return $digits;
	}

	/** @return bool */
	private function is_valid_phone( $phone ) {
		return (bool) preg_match( '/^09\d{9}$/', $phone );
	}

	/** @return string */
	private function session_token_from_request( $request ) {
		$token = trim( (string) $request->get_header( 'x-sepiid-session' ) );
		if ( $token ) {
			return $token;
		}
		$authorization = trim( (string) $request->get_header( 'authorization' ) );
		return preg_match( '/^Bearer\s+(.+)$/i', $authorization, $matches ) ? trim( $matches[1] ) : '';
	}

	/** @return string */
	private function client_ip() {
		return isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
	}

	/** @return string */
	private function fingerprint( $value ) {
		return hash_hmac( 'sha256', $value, wp_salt( 'auth' ) );
	}

	/** @return void */
	private function cleanup_expired_sessions() {
		global $wpdb;
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$this->table_name} WHERE expires_at < %s",
				gmdate( 'Y-m-d H:i:s' )
			)
		);
	}

	/** @return void */
	private function trim_user_sessions( $user_id ) {
		global $wpdb;
		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT id FROM {$this->table_name} WHERE user_id = %d ORDER BY created_at DESC",
				$user_id
			)
		);
		$stale_ids = array_slice( array_map( 'intval', $ids ), self::MAX_SESSIONS );
		foreach ( $stale_ids as $id ) {
			$wpdb->delete( $this->table_name, array( 'id' => $id ), array( '%d' ) );
		}
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
