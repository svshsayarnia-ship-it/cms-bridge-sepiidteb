<?php
/**
 * Storefront password policy guard for Sepiid Beauty customer accounts.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

final class Customer_Password_Policy {
	/** @return void */
	public function hooks() {
		add_filter( 'rest_pre_dispatch', array( $this, 'guard_password_routes' ), 9, 3 );
	}

	/**
	 * Require an ASCII letter and number before the core customer-auth callback.
	 * The existing auth controller keeps its additional minimum-strength checks.
	 *
	 * @param mixed            $result Existing result.
	 * @param \WP_REST_Server  $server REST server.
	 * @param \WP_REST_Request $request Request.
	 * @return mixed
	 */
	public function guard_password_routes( $result, $server, $request ) {
		unset( $server );
		if ( null !== $result ) {
			return $result;
		}

		$route = $request->get_route();
		if ( ! in_array( $route, array( '/sepiid/v1/auth/register', '/sepiid/v1/auth/password/reset' ), true ) ) {
			return $result;
		}

		$password = (string) $request->get_param( 'password' );
		if ( strlen( $password ) < 10 ) {
			return $this->error( 'sepiid_weak_password', 'رمز باید حداقل ۱۰ کاراکتر باشد.', 400 );
		}

		$has_letter = (bool) preg_match( '/[A-Za-z]/', $password );
		$has_number = (bool) preg_match( '/[0-9]/', $password );
		if ( ! $has_letter ) {
			if ( preg_match( '/[\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{08A0}-\x{08FF}]/u', $password ) ) {
				return $this->error(
					'sepiid_password_keyboard_language',
					'به نظر می‌رسد کیبورد روی فارسی است. کیبورد را روی English بگذار و حداقل یک حرف انگلیسی وارد کن.',
					400
				);
			}
			return $this->error( 'sepiid_password_letter_required', 'رمز باید حداقل یک حرف انگلیسی داشته باشد.', 400 );
		}

		if ( ! $has_number ) {
			return $this->error( 'sepiid_password_number_required', 'رمز باید حداقل یک عدد انگلیسی داشته باشد.', 400 );
		}

		return $result;
	}

	/** @return \WP_Error */
	private function error( $code, $message, $status ) {
		return new \WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
