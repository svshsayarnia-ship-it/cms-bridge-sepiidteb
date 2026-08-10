<?php
/**
 * Customer authentication endpoints used by the Sepiid Beauty storefront.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

/**
 * Keeps customer identity in WordPress/WooCommerce while the Next.js storefront
 * owns its own signed HTTP-only session cookie.
 *
 * Every route is protected by the existing WooCommerce REST API key. Customer
 * passwords are only verified inside WordPress and are never returned.
 */
final class Customer_Auth_Controller {
	const REST_NAMESPACE = 'wc/v3';
	const RATE_WINDOW    = 15 * MINUTE_IN_SECONDS;
	const MAX_ATTEMPTS   = 8;

	/**
	 * Register WordPress hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register customer account endpoints.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/sepiid-customer-auth/login',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'login' ),
				'permission_callback' => array( $this, 'check_bridge_permissions' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/sepiid-customer-auth/register',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'register' ),
				'permission_callback' => array( $this, 'check_bridge_permissions' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/sepiid-customer-auth/profile/(?P<id>\d+)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_profile' ),
					'permission_callback' => array( $this, 'check_bridge_permissions' ),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_profile' ),
					'permission_callback' => array( $this, 'check_bridge_permissions' ),
				),
			)
		);
	}

	/**
	 * Require a server-side WooCommerce REST key owner.
	 *
	 * @return true|\WP_Error
	 */
	public function check_bridge_permissions() {
		if ( ! get_current_user_id() ) {
			return new \WP_Error(
				'sepiid_customer_bridge_auth_required',
				'احراز هویت Sepiid Bridge لازم است.',
				array( 'status' => 401 )
			);
		}

		if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'edit_products' ) ) {
			return new \WP_Error(
				'sepiid_customer_bridge_forbidden',
				'این کلید اجازه مدیریت مشتریان سپید را ندارد.',
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Authenticate one WooCommerce customer with mobile/email + password.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function login( $request ) {
		$identifier = trim( sanitize_text_field( (string) $request->get_param( 'identifier' ) ) );
		$password   = (string) $request->get_param( 'password' );
		$client_ip  = $this->client_ip( $request );

		if ( '' === $identifier || '' === $password ) {
			return $this->error( 'sepiid_customer_missing_credentials', 'شماره موبایل/ایمیل و رمز عبور لازم است.', 400 );
		}

		$rate_key = $this->rate_key( 'login', $client_ip . '|' . mb_strtolower( $identifier ) );
		if ( $this->rate_limited( $rate_key ) ) {
			return $this->error( 'sepiid_customer_too_many_attempts', 'تعداد تلاش ورود زیاد است. کمی بعد دوباره امتحان کن.', 429 );
		}

		$login = $this->resolve_login( $identifier );
		if ( ! $login ) {
			$this->record_failed_attempt( $rate_key );
			return $this->invalid_credentials();
		}

		$user = wp_authenticate( $login, $password );
		if ( is_wp_error( $user ) || ! $this->is_customer( $user ) ) {
			$this->record_failed_attempt( $rate_key );
			return $this->invalid_credentials();
		}

		delete_transient( $rate_key );
		return $this->profile_response( $user->ID );
	}

	/**
	 * Create one real WooCommerce customer.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function register( $request ) {
		$full_name     = trim( sanitize_text_field( (string) $request->get_param( 'full_name' ) ) );
		$email         = sanitize_email( (string) $request->get_param( 'email' ) );
		$phone         = $this->normalize_iran_phone( (string) $request->get_param( 'phone' ) );
		$password      = (string) $request->get_param( 'password' );
		$clinic_name   = trim( sanitize_text_field( (string) $request->get_param( 'clinic_name' ) ) );
		$city          = trim( sanitize_text_field( (string) $request->get_param( 'city' ) ) );
		$customer_type = $this->sanitize_customer_type( (string) $request->get_param( 'customer_type' ) );
		$client_ip     = $this->client_ip( $request );

		$rate_key = $this->rate_key( 'register', $client_ip );
		if ( $this->rate_limited( $rate_key, 4 ) ) {
			return $this->error( 'sepiid_customer_registration_limited', 'تعداد ثبت‌نام از این اتصال زیاد است. کمی بعد دوباره امتحان کن.', 429 );
		}

		if ( mb_strlen( $full_name ) < 3 ) {
			return $this->error( 'sepiid_customer_invalid_name', 'نام و نام خانوادگی را کامل وارد کن.', 400 );
		}
		if ( ! is_email( $email ) ) {
			return $this->error( 'sepiid_customer_invalid_email', 'ایمیل معتبر وارد کن.', 400 );
		}
		if ( ! $phone ) {
			return $this->error( 'sepiid_customer_invalid_phone', 'شماره موبایل ایران را با فرمت 09xxxxxxxxx وارد کن.', 400 );
		}
		if ( strlen( $password ) < 8 ) {
			return $this->error( 'sepiid_customer_weak_password', 'رمز عبور باید حداقل ۸ کاراکتر باشد.', 400 );
		}

		if ( username_exists( $phone ) || email_exists( $email ) || $this->find_user_by_phone( $phone ) ) {
			return $this->error( 'sepiid_customer_exists', 'این شماره موبایل یا ایمیل قبلاً ثبت شده است.', 409 );
		}

		$customer_id = wc_create_new_customer( $email, $phone, $password );
		if ( is_wp_error( $customer_id ) ) {
			return $this->error( 'sepiid_customer_create_failed', 'ساخت حساب کاربری انجام نشد. اطلاعات را بررسی کن.', 400 );
		}

		$names      = $this->split_name( $full_name );
		$customer   = new \WC_Customer( $customer_id );
		$customer->set_first_name( $names['first_name'] );
		$customer->set_last_name( $names['last_name'] );
		$customer->set_billing_first_name( $names['first_name'] );
		$customer->set_billing_last_name( $names['last_name'] );
		$customer->set_billing_email( $email );
		$customer->set_billing_phone( $phone );
		$customer->set_billing_company( $clinic_name );
		$customer->set_billing_city( $city );
		$customer->save();

		update_user_meta( $customer_id, 'sepiid_full_name', $full_name );
		update_user_meta( $customer_id, 'sepiid_customer_type', $customer_type );
		update_user_meta( $customer_id, 'sepiid_phone_normalized', $phone );

		$this->record_failed_attempt( $rate_key );
		return $this->profile_response( $customer_id, 201 );
	}

	/**
	 * Read one customer profile.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_profile( $request ) {
		$customer_id = absint( $request['id'] );
		return $this->profile_response( $customer_id );
	}

	/**
	 * Update only customer-facing profile fields. Login phone/email remain stable.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_profile( $request ) {
		$customer_id = absint( $request['id'] );
		$user        = get_user_by( 'id', $customer_id );
		if ( ! $user || ! $this->is_customer( $user ) ) {
			return $this->error( 'sepiid_customer_not_found', 'حساب مشتری پیدا نشد.', 404 );
		}

		$full_name     = trim( sanitize_text_field( (string) $request->get_param( 'full_name' ) ) );
		$clinic_name   = trim( sanitize_text_field( (string) $request->get_param( 'clinic_name' ) ) );
		$city          = trim( sanitize_text_field( (string) $request->get_param( 'city' ) ) );
		$customer_type = $this->sanitize_customer_type( (string) $request->get_param( 'customer_type' ) );

		if ( mb_strlen( $full_name ) < 3 ) {
			return $this->error( 'sepiid_customer_invalid_name', 'نام و نام خانوادگی را کامل وارد کن.', 400 );
		}

		$names    = $this->split_name( $full_name );
		$customer = new \WC_Customer( $customer_id );
		$customer->set_first_name( $names['first_name'] );
		$customer->set_last_name( $names['last_name'] );
		$customer->set_billing_first_name( $names['first_name'] );
		$customer->set_billing_last_name( $names['last_name'] );
		$customer->set_billing_company( $clinic_name );
		$customer->set_billing_city( $city );
		$customer->save();

		update_user_meta( $customer_id, 'sepiid_full_name', $full_name );
		update_user_meta( $customer_id, 'sepiid_customer_type', $customer_type );

		return $this->profile_response( $customer_id );
	}

	/**
	 * Return a safe public customer shape.
	 *
	 * @param int $customer_id Customer ID.
	 * @param int $status HTTP status.
	 * @return \WP_REST_Response|\WP_Error
	 */
	private function profile_response( $customer_id, $status = 200 ) {
		$user = get_user_by( 'id', $customer_id );
		if ( ! $user || ! $this->is_customer( $user ) ) {
			return $this->error( 'sepiid_customer_not_found', 'حساب مشتری پیدا نشد.', 404 );
		}

		$customer = new \WC_Customer( $customer_id );
		$full_name = trim( (string) get_user_meta( $customer_id, 'sepiid_full_name', true ) );
		if ( '' === $full_name ) {
			$full_name = trim( $customer->get_first_name() . ' ' . $customer->get_last_name() );
		}
		if ( '' === $full_name ) {
			$full_name = $user->display_name;
		}

		$response = new \WP_REST_Response(
			array(
				'profile' => array(
					'id'            => (int) $customer_id,
					'fullName'      => $full_name,
					'email'         => (string) $customer->get_email(),
					'phone'         => (string) $customer->get_billing_phone(),
					'clinicName'    => (string) $customer->get_billing_company(),
					'city'          => (string) $customer->get_billing_city(),
					'customerType'  => $this->sanitize_customer_type( (string) get_user_meta( $customer_id, 'sepiid_customer_type', true ) ),
					'dateCreated'   => $customer->get_date_created() ? $customer->get_date_created()->date( DATE_ATOM ) : null,
				),
			),
			$status
		);
		$response->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0' );
		return $response;
	}

	/**
	 * Resolve an email, username or Iranian mobile number to a WordPress login.
	 *
	 * @param string $identifier Identifier.
	 * @return string|null
	 */
	private function resolve_login( $identifier ) {
		$phone = $this->normalize_iran_phone( $identifier );
		if ( $phone ) {
			$user = get_user_by( 'login', $phone );
			if ( ! $user ) {
				$user = $this->find_user_by_phone( $phone );
			}
			return $user ? $user->user_login : null;
		}

		if ( is_email( $identifier ) ) {
			$user = get_user_by( 'email', sanitize_email( $identifier ) );
			return $user ? $user->user_login : null;
		}

		$user = get_user_by( 'login', sanitize_user( $identifier ) );
		return $user ? $user->user_login : null;
	}

	/**
	 * Find an existing customer by normalized phone metadata.
	 *
	 * @param string $phone Normalized phone.
	 * @return \WP_User|null
	 */
	private function find_user_by_phone( $phone ) {
		$users = get_users(
			array(
				'number'     => 1,
				'count_total'=> false,
				'meta_query' => array(
					'relation' => 'OR',
					array(
						'key'   => 'sepiid_phone_normalized',
						'value' => $phone,
					),
					array(
						'key'   => 'billing_phone',
						'value' => $phone,
					),
				),
			)
		);
		return ! empty( $users[0] ) ? $users[0] : null;
	}

	/**
	 * Normalize common Iran mobile formats to 09xxxxxxxxx.
	 *
	 * @param string $value Input phone.
	 * @return string|null
	 */
	private function normalize_iran_phone( $value ) {
		$value = strtr(
			(string) $value,
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
		} elseif ( 10 === strlen( $digits ) && '9' === substr( $digits, 0, 1 ) ) {
			$digits = '0' . $digits;
		}
		return preg_match( '/^09\d{9}$/', $digits ) ? $digits : null;
	}

	/**
	 * Keep business segmentation separate from WordPress capabilities.
	 *
	 * @param string $value Customer type.
	 * @return string
	 */
	private function sanitize_customer_type( $value ) {
		$allowed = array( 'clinic', 'doctor', 'buyer', 'customer' );
		$value   = sanitize_key( $value );
		return in_array( $value, $allowed, true ) ? $value : 'customer';
	}

	/**
	 * Split a Persian full name conservatively for WooCommerce first/last fields.
	 *
	 * @param string $full_name Full name.
	 * @return array{first_name:string,last_name:string}
	 */
	private function split_name( $full_name ) {
		$parts = preg_split( '/\s+/u', trim( $full_name ), 2 );
		return array(
			'first_name' => isset( $parts[0] ) ? $parts[0] : '',
			'last_name'  => isset( $parts[1] ) ? $parts[1] : '',
		);
	}

	/**
	 * Customer accounts must never elevate to a WordPress administrative role.
	 *
	 * @param \WP_User $user WordPress user.
	 * @return bool
	 */
	private function is_customer( $user ) {
		return $user instanceof \WP_User && in_array( 'customer', (array) $user->roles, true );
	}

	/**
	 * Extract the original browser IP forwarded by the Next.js server.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return string
	 */
	private function client_ip( $request ) {
		$value = trim( sanitize_text_field( (string) $request->get_header( 'x-sepiid-client-ip' ) ) );
		return filter_var( $value, FILTER_VALIDATE_IP ) ? $value : 'unknown';
	}

	/**
	 * Build a non-PII transient key.
	 *
	 * @param string $action Action.
	 * @param string $fingerprint Fingerprint.
	 * @return string
	 */
	private function rate_key( $action, $fingerprint ) {
		return 'sepiid_customer_' . sanitize_key( $action ) . '_' . hash( 'sha256', (string) $fingerprint );
	}

	/**
	 * Check a transient rate counter.
	 *
	 * @param string $key Transient key.
	 * @param int $limit Limit.
	 * @return bool
	 */
	private function rate_limited( $key, $limit = self::MAX_ATTEMPTS ) {
		return (int) get_transient( $key ) >= $limit;
	}

	/**
	 * Increment a transient rate counter.
	 *
	 * @param string $key Transient key.
	 * @return void
	 */
	private function record_failed_attempt( $key ) {
		$count = (int) get_transient( $key );
		set_transient( $key, $count + 1, self::RATE_WINDOW );
	}

	/**
	 * Generic login error avoids customer enumeration.
	 *
	 * @return \WP_Error
	 */
	private function invalid_credentials() {
		return $this->error( 'sepiid_customer_invalid_credentials', 'اطلاعات ورود صحیح نیست.', 401 );
	}

	/**
	 * Create a stable REST error.
	 *
	 * @param string $code Code.
	 * @param string $message Message.
	 * @param int $status HTTP status.
	 * @return \WP_Error
	 */
	private function error( $code, $message, $status ) {
		return new \WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
