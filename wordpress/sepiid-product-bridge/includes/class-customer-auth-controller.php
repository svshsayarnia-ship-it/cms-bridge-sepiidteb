<?php
/**
 * Customer authentication endpoints for Sepiid Beauty.
 *
 * Password verification stays inside WordPress/WooCommerce. The storefront
 * receives only a short opaque session token; only its SHA-256 hash is stored.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

final class Customer_Auth_Controller {
	const REST_NAMESPACE = 'sepiid/v1';
	const SCHEMA_VERSION = 1;
	const SESSION_TTL    = 2592000; // 30 days.
	const LOGIN_LIMIT    = 5;
	const LOGIN_WINDOW   = 900;
	const RESET_LIMIT    = 3;
	const RESET_WINDOW   = 3600;

	/** @var string */
	private $table_name;

	public function __construct() {
		global $wpdb;
		$this->table_name = $wpdb->prefix . 'sepiid_customer_sessions';
	}

	/**
	 * Register WordPress hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'init', array( $this, 'maybe_install' ), 5 );
	}

	/**
	 * Create/update the session table when the plugin version changes.
	 *
	 * @return void
	 */
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

	/**
	 * Register customer-auth REST routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		$public = '__return_true';

		register_rest_route(
			self::REST_NAMESPACE,
			'/auth/register',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'register_customer' ),
				'permission_callback' => $public,
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/auth/login',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'login' ),
				'permission_callback' => $public,
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/auth/session',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'session' ),
				'permission_callback' => $public,
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/auth/logout',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'logout' ),
				'permission_callback' => $public,
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/auth/profile',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_profile' ),
				'permission_callback' => $public,
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/auth/password/request',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'request_password_reset' ),
				'permission_callback' => $public,
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/auth/password/reset',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'reset_password' ),
				'permission_callback' => $public,
			)
		);
	}

	/**
	 * Create a WooCommerce customer and an authenticated session.
	 *
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
		$account_type = sanitize_key( (string) $request->get_param( 'accountType' ) );

		$rate = $this->rate_limit( 'register', $this->client_ip(), 5, HOUR_IN_SECONDS );
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

		if ( ! in_array( $account_type, array( 'customer', 'clinic', 'doctor', 'buyer' ), true ) ) {
			$account_type = 'customer';
		}

		$user_id = wc_create_new_customer( $email, '', $password );
		if ( is_wp_error( $user_id ) ) {
			return $this->error( 'sepiid_registration_failed', 'ساخت حساب انجام نشد. دوباره تلاش کن.', 400 );
		}

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
		update_user_meta( $user_id, 'billing_city', $city );
		update_user_meta( $user_id, 'sepiid_clinic_name', $clinic_name );
		update_user_meta( $user_id, 'sepiid_account_type', $account_type );

		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			return $this->error( 'sepiid_registration_failed', 'ساخت حساب تکمیل نشد.', 500 );
		}

		$token = $this->create_session( $user, $request );
		return $this->success(
			array(
				'token' => $token,
				'user'  => $this->public_user( $user ),
			)
		);
	}

	/**
	 * Authenticate by email, username, or mobile number.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function login( $request ) {
		$identifier = sanitize_text_field( (string) $request->get_param( 'identifier' ) );
		$password   = (string) $request->get_param( 'password' );
		$rate_key   = hash( 'sha256', strtolower( $identifier ) . '|' . $this->client_ip() );
		$rate       = $this->rate_limit( 'login', $rate_key, self::LOGIN_LIMIT, self::LOGIN_WINDOW );

		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		$user = $this->find_user( $identifier );
		if ( ! $user ) {
			$this->fake_password_work();
			return $this->invalid_credentials();
		}

		$authenticated = wp_authenticate( $user->user_login, $password );
		if ( is_wp_error( $authenticated ) ) {
			return $this->invalid_credentials();
		}

		$token = $this->create_session( $authenticated, $request );
		return $this->success(
			array(
				'token' => $token,
				'user'  => $this->public_user( $authenticated ),
			)
		);
	}

	/**
	 * Return the currently authenticated customer.
	 *
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
	 * Revoke the current session, or every session when all=true.
	 *
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
	 * Update non-sensitive customer profile fields.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_profile( $request ) {
		$session = $this->authenticate_session( $request );
		if ( is_wp_error( $session ) ) {
			return $session;
		}

		$user_id      = $session['user']->ID;
		$full_name    = sanitize_text_field( (string) $request->get_param( 'fullName' ) );
		$phone        = $this->normalize_phone( (string) $request->get_param( 'phone' ) );
		$city         = sanitize_text_field( (string) $request->get_param( 'city' ) );
		$clinic_name  = sanitize_text_field( (string) $request->get_param( 'clinicName' ) );
		$account_type = sanitize_key( (string) $request->get_param( 'accountType' ) );

		if ( '' === trim( $full_name ) || ! $this->is_valid_phone( $phone ) ) {
			return $this->error( 'sepiid_invalid_profile', 'نام و شماره موبایل معتبر لازم است.', 400 );
		}

		$phone_owner = $this->find_user_by_phone( $phone );
		if ( $phone_owner && (int) $phone_owner->ID !== (int) $user_id ) {
			return $this->error( 'sepiid_phone_in_use', 'این شماره موبایل به حساب دیگری متصل است.', 409 );
		}

		if ( ! in_array( $account_type, array( 'customer', 'clinic', 'doctor', 'buyer' ), true ) ) {
			$account_type = 'customer';
		}

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
		update_user_meta( $user_id, 'billing_city', $city );
		update_user_meta( $user_id, 'sepiid_clinic_name', $clinic_name );
		update_user_meta( $user_id, 'sepiid_account_type', $account_type );

		$user = get_user_by( 'id', $user_id );
		return $this->success( array( 'user' => $this->public_user( $user ) ) );
	}

	/**
	 * Send a reset link without revealing whether an account exists.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function request_password_reset( $request ) {
		$identifier = sanitize_text_field( (string) $request->get_param( 'identifier' ) );
		$rate_key   = hash( 'sha256', strtolower( $identifier ) . '|' . $this->client_ip() );
		$rate       = $this->rate_limit( 'reset', $rate_key, self::RESET_LIMIT, self::RESET_WINDOW );
		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		$user = $this->find_user( $identifier );
		if ( $user ) {
			$key = get_password_reset_key( $user );
			if ( ! is_wp_error( $key ) ) {
				$base = apply_filters( 'sepiid_storefront_url', 'https://sepiidbeauty.ir' );
				$url  = add_query_arg(
					array(
						'key'   => rawurlencode( $key ),
						'login' => rawurlencode( $user->user_login ),
					),
					trailingslashit( $base ) . 'account/reset-password'
				);
				$subject = 'بازیابی رمز حساب سپید بیوتی';
				$message = "برای انتخاب رمز جدید، لینک زیر را باز کنید:\n\n" . esc_url_raw( $url ) . "\n\nاگر این درخواست از طرف شما نبوده، آن را نادیده بگیرید.";
				wp_mail( $user->user_email, $subject, $message );
			}
		}

		return $this->success(
			array( 'message' => 'اگر حسابی با این مشخصات وجود داشته باشد، لینک بازیابی ارسال می‌شود.' )
		);
	}

	/**
	 * Complete a WordPress password reset and revoke existing sessions.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function reset_password( $request ) {
		$login    = sanitize_user( (string) $request->get_param( 'login' ), true );
		$key      = sanitize_text_field( (string) $request->get_param( 'key' ) );
		$password = (string) $request->get_param( 'password' );
		$rate     = $this->rate_limit( 'reset-complete', $this->client_ip(), 10, HOUR_IN_SECONDS );
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
	 * Create a high-entropy opaque session and store only its hash.
	 *
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
				'user_agent_hash' => $this->request_fingerprint( (string) $request->get_header( 'user-agent' ) ),
				'ip_hash'         => $this->request_fingerprint( $this->client_ip() ),
			),
			array( '%s', '%d', '%s', '%s', '%s', '%s', '%s' )
		);

		$this->trim_user_sessions( $user->ID );
		return $token;
	}

	/**
	 * Validate a session token and return its user.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return array|\WP_Error
	 */
	private function authenticate_session( $request ) {
		$token = $this->session_token_from_request( $request );
		if ( ! $token || ! preg_match( '/^[A-Za-z0-9_-]{40,128}$/', $token ) ) {
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
				$wpdb->delete( $this->table_name, array( 'id' => $row->id ), array( '%d' ) );
			}
			return $this->error( 'sepiid_session_expired', 'نشست کاربری منقضی شده است. دوباره وارد شو.', 401 );
		}

		$user = get_user_by( 'id', (int) $row->user_id );
		if ( ! $user ) {
			$wpdb->delete( $this->table_name, array( 'id' => $row->id ), array( '%d' ) );
			return $this->error( 'sepiid_auth_required', 'نشست کاربری معتبر نیست.', 401 );
		}

		if ( strtotime( $row->last_seen_at . ' UTC' ) < time() - 300 ) {
			$wpdb->update(
				$this->table_name,
				array( 'last_seen_at' => gmdate( 'Y-m-d H:i:s' ) ),
				array( 'id' => $row->id ),
				array( '%s' ),
				array( '%d' )
			);
		}

		return array(
			'user'       => $user,
			'token_hash' => $token_hash,
		);
	}

	/**
	 * Build the safe customer projection returned to the storefront.
	 *
	 * @param \WP_User $user User.
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
	 * Resolve a customer by email, username, or phone.
	 *
	 * @param string $identifier Identifier.
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
	 * Find one user by billing phone.
	 *
	 * @param string $phone Phone.
	 * @return \WP_User|false
	 */
	private function find_user_by_phone( $phone ) {
		$users = get_users(
			array(
				'number'     => 1,
				'count_total'=> false,
				'meta_key'   => 'billing_phone',
				'meta_value' => $phone,
			)
		);
		return ! empty( $users ) ? $users[0] : false;
	}

	/**
	 * Rate limit using short-lived transients.
	 *
	 * @return true|\WP_Error
	 */
	private function rate_limit( $bucket, $identity, $limit, $window ) {
		$key   = 'sepiid_rl_' . md5( $bucket . '|' . $identity );
		$count = (int) get_transient( $key );
		if ( $count >= $limit ) {
			return $this->error( 'sepiid_rate_limited', 'تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کن.', 429 );
		}
		set_transient( $key, $count + 1, $window );
		return true;
	}

	/**
	 * Validate password baseline without storing it.
	 *
	 * @param string $password Password.
	 * @return string|null
	 */
	private function password_error( $password ) {
		if ( strlen( $password ) < 10 ) {
			return 'رمز باید حداقل ۱۰ کاراکتر باشد.';
		}

		$classes = 0;
		$classes += preg_match( '/[a-z]/', $password ) ? 1 : 0;
		$classes += preg_match( '/[A-Z]/', $password ) ? 1 : 0;
		$classes += preg_match( '/[0-9]/', $password ) ? 1 : 0;
		$classes += preg_match( '/[^A-Za-z0-9]/', $password ) ? 1 : 0;
		if ( $classes < 3 ) {
			return 'رمز را از ترکیب حروف، عدد و نشانه‌ها بساز.';
		}
		return null;
	}

	private function invalid_credentials() {
		return $this->error( 'sepiid_invalid_credentials', 'اطلاعات ورود درست نیست.', 401 );
	}

	private function fake_password_work() {
		wp_check_password( 'sepiid-invalid-password', '$P$B123456789012345678901234567890' );
	}

	private function normalize_phone( $value ) {
		$value = strtr(
			$value,
			array(
				'۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9',
				'٠'=>'0','١'=>'1','٢'=>'2','٣'=>'3','٤'=>'4','٥'=>'5','٦'=>'6','٧'=>'7','٨'=>'8','٩'=>'9',
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

	private function is_valid_phone( $phone ) {
		return (bool) preg_match( '/^09\d{9}$/', $phone );
	}

	private function session_token_from_request( $request ) {
		$token = trim( (string) $request->get_header( 'x-sepiid-session' ) );
		if ( $token ) {
			return $token;
		}
		$authorization = trim( (string) $request->get_header( 'authorization' ) );
		if ( preg_match( '/^Bearer\s+(.+)$/i', $authorization, $matches ) ) {
			return trim( $matches[1] );
		}
		return '';
	}

	private function client_ip() {
		return isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
	}

	private function request_fingerprint( $value ) {
		return hash_hmac( 'sha256', $value, wp_salt( 'auth' ) );
	}

	private function cleanup_expired_sessions() {
		global $wpdb;
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$this->table_name} WHERE expires_at < %s",
				gmdate( 'Y-m-d H:i:s' )
			)
		);
	}

	private function trim_user_sessions( $user_id ) {
		global $wpdb;
		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT id FROM {$this->table_name} WHERE user_id = %d ORDER BY created_at DESC",
				$user_id
			)
		);
		$stale = array_slice( array_map( 'intval', $ids ), 5 );
		if ( empty( $stale ) ) {
			return;
		}
		$placeholders = implode( ',', array_fill( 0, count( $stale ), '%d' ) );
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$this->table_name} WHERE id IN ({$placeholders})", $stale ) );
	}

	private function base64url( $bytes ) {
		return rtrim( strtr( base64_encode( $bytes ), '+/', '-_' ), '=' );
	}

	private function success( $data, $status = 200 ) {
		$response = new \WP_REST_Response( $data, $status );
		$response->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0' );
		$response->header( 'Pragma', 'no-cache' );
		return $response;
	}

	private function error( $code, $message, $status ) {
		return new \WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
