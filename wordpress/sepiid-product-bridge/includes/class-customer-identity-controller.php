<?php
/**
 * Database-backed customer phone identity for Sepiid Beauty.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

final class Customer_Identity_Controller {
	const SCHEMA_VERSION = 1;
	const RESERVATION_TTL = 1200;

	/** @var string */
	private $table_name;

	/** @var string */
	private $session_table;

	/** @var int */
	private $registration_reservation_id = 0;

	public function __construct() {
		global $wpdb;
		$this->table_name    = $wpdb->prefix . 'sepiid_customer_identity';
		$this->session_table = $wpdb->prefix . 'sepiid_customer_sessions';
	}

	/** @return void */
	public function hooks() {
		add_action( 'init', array( $this, 'maybe_install' ), 4 );
		add_action( 'init', array( $this, 'maybe_backfill' ), 25 );
		add_filter( 'rest_pre_dispatch', array( $this, 'guard_identity_routes' ), 11, 3 );
		add_filter( 'rest_post_dispatch', array( $this, 'finalize_identity_routes' ), 20, 3 );
	}

	/** @return void */
	public function maybe_install() {
		if ( (int) get_option( 'sepiid_customer_identity_schema_version', 0 ) === self::SCHEMA_VERSION ) {
			return;
		}

		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$charset_collate = $wpdb->get_charset_collate();
		$sql = "CREATE TABLE {$this->table_name} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			user_id bigint(20) unsigned DEFAULT NULL,
			phone_normalized varchar(20) NOT NULL,
			phone_verified_at datetime DEFAULT NULL,
			created_at datetime NOT NULL,
			updated_at datetime NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY phone_normalized (phone_normalized),
			UNIQUE KEY user_id (user_id)
		) {$charset_collate};";

		dbDelta( $sql );
		update_option( 'sepiid_customer_identity_schema_version', self::SCHEMA_VERSION, false );
	}

	/**
	 * Reserve a verified registration phone at database level and keep the
	 * login identity immutable until a dedicated phone-change OTP flow exists.
	 *
	 * @param mixed            $result Existing result.
	 * @param \WP_REST_Server  $server REST server.
	 * @param \WP_REST_Request $request Request.
	 * @return mixed
	 */
	public function guard_identity_routes( $result, $server, $request ) {
		unset( $server );
		if ( null !== $result ) {
			return $result;
		}

		$route = $request->get_route();
		if ( '/sepiid/v1/auth/profile' === $route ) {
			return $this->guard_profile_phone( $request );
		}
		if ( '/sepiid/v1/auth/register' !== $route ) {
			return $result;
		}

		$phone = $this->normalize_phone( (string) $request->get_param( 'phone' ) );
		if ( ! $this->is_valid_phone( $phone ) ) {
			return $this->error( 'sepiid_invalid_phone', 'شماره موبایل معتبر وارد کن.', 400 );
		}

		global $wpdb;
		// A fatal error or an interrupted response must not permanently reserve a
		// verified phone. Active proofs live for ten minutes, so twenty minutes is
		// enough to preserve an in-flight request while recovering abandoned rows.
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$this->table_name} WHERE phone_normalized = %s AND user_id IS NULL AND created_at < %s",
				$phone,
				gmdate( 'Y-m-d H:i:s', time() - self::RESERVATION_TTL )
			)
		);
		$now = gmdate( 'Y-m-d H:i:s' );
		$inserted = $wpdb->query(
			$wpdb->prepare(
				"INSERT INTO {$this->table_name} (user_id, phone_normalized, phone_verified_at, created_at, updated_at) VALUES (NULL, %s, %s, %s, %s)",
				$phone,
				$now,
				$now,
				$now
			)
		);

		if ( 1 !== $inserted ) {
			return $this->error(
				'sepiid_phone_in_use',
				'این شماره موبایل قبلاً برای حساب دیگری ثبت یا رزرو شده است.',
				409
			);
		}

		$this->registration_reservation_id = (int) $wpdb->insert_id;
		return $result;
	}

	/**
	 * Attach a successful registration reservation to the new WooCommerce user,
	 * or release it when registration fails.
	 *
	 * @param mixed            $response Response.
	 * @param \WP_REST_Server  $server REST server.
	 * @param \WP_REST_Request $request Request.
	 * @return mixed
	 */
	public function finalize_identity_routes( $response, $server, $request ) {
		unset( $server );
		if ( '/sepiid/v1/auth/register' !== $request->get_route() || ! $this->registration_reservation_id ) {
			return $response;
		}

		$status  = is_object( $response ) && method_exists( $response, 'get_status' ) ? (int) $response->get_status() : 500;
		$user_id = 0;
		if ( $status >= 200 && $status < 300 && is_object( $response ) && method_exists( $response, 'get_data' ) ) {
			$data    = $response->get_data();
			$user_id = isset( $data['user']['id'] ) ? (int) $data['user']['id'] : 0;
		}

		global $wpdb;
		if ( $user_id > 0 ) {
			$updated = $wpdb->update(
				$this->table_name,
				array(
					'user_id'             => $user_id,
					'phone_verified_at'   => gmdate( 'Y-m-d H:i:s' ),
					'updated_at'          => gmdate( 'Y-m-d H:i:s' ),
				),
				array( 'id' => $this->registration_reservation_id ),
				array( '%d', '%s', '%s' ),
				array( '%d' )
			);
			if ( false === $updated ) {
				$wpdb->delete( $this->table_name, array( 'id' => $this->registration_reservation_id ), array( '%d' ) );
			}
		} else {
			$wpdb->delete( $this->table_name, array( 'id' => $this->registration_reservation_id ), array( '%d' ) );
		}

		$this->registration_reservation_id = 0;
		return $response;
	}

	/**
	 * Backfill unambiguous legacy customer phone identities. Duplicate legacy
	 * phones are deliberately skipped and counted for manual reconciliation.
	 *
	 * @return void
	 */
	public function maybe_backfill() {
		if ( '1' === (string) get_option( 'sepiid_customer_identity_backfill_v1', '' ) ) {
			return;
		}

		global $wpdb;
		$rows = $wpdb->get_results(
			"SELECT user_id, meta_value FROM {$wpdb->usermeta} WHERE meta_key = 'billing_phone' AND meta_value <> ''"
		);
		$phones = array();
		foreach ( $rows as $row ) {
			$phone = $this->normalize_phone( (string) $row->meta_value );
			if ( ! $this->is_valid_phone( $phone ) ) {
				continue;
			}
			if ( ! isset( $phones[ $phone ] ) ) {
				$phones[ $phone ] = array();
			}
			$phones[ $phone ][ (int) $row->user_id ] = true;
		}

		$conflicts = 0;
		$now       = gmdate( 'Y-m-d H:i:s' );
		foreach ( $phones as $phone => $user_ids ) {
			$ids = array_keys( $user_ids );
			if ( 1 !== count( $ids ) ) {
				++$conflicts;
				continue;
			}

			$wpdb->query(
				$wpdb->prepare(
					"INSERT IGNORE INTO {$this->table_name} (user_id, phone_normalized, phone_verified_at, created_at, updated_at) VALUES (%d, %s, NULL, %s, %s)",
					(int) $ids[0],
					$phone,
					$now,
					$now
				)
			);
		}

		update_option( 'sepiid_customer_identity_conflict_count', $conflicts, false );
		update_option( 'sepiid_customer_identity_backfill_v1', '1', false );
	}

	/** @return mixed */
	private function guard_profile_phone( $request ) {
		$user_id = $this->session_user_id( $request );
		if ( ! $user_id ) {
			return null;
		}

		$current   = $this->normalize_phone( (string) get_user_meta( $user_id, 'billing_phone', true ) );
		$requested = $this->normalize_phone( (string) $request->get_param( 'phone' ) );
		if ( $this->is_valid_phone( $current ) && $requested !== $current ) {
			return $this->error(
				'sepiid_phone_reverification_required',
				'برای تغییر شماره موبایل باید شماره جدید با کد پیامکی دوباره تأیید شود.',
				403
			);
		}
		return null;
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

	/** @return \WP_Error */
	private function error( $code, $message, $status ) {
		return new \WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
