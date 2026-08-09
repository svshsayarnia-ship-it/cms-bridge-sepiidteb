<?php
/**
 * REST endpoints used by Sepiid CMS.
 *
 * @package SepiidProductBridge
 */

namespace Sepiid\ProductBridge;

defined( 'ABSPATH' ) || exit;

/**
 * Adds only the media operations missing from the WooCommerce REST API.
 * Product and category CRUD continue to use WooCommerce core wc/v3 routes.
 */
final class Rest_Controller {
	const REST_NAMESPACE   = 'wc/v3';
	const CONTRACT_VERSION = 1;
	const MAX_UPLOAD_BYTES = 10485760;

	/**
	 * Register WordPress hooks.
	 *
	 * @return void
	 */
	public function hooks() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register authenticated endpoints inside wc/v3 so WooCommerce API keys work.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/sepiid-bridge/health',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_health' ),
				'permission_callback' => array( $this, 'check_read_permissions' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/sepiid-media',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_media' ),
				'permission_callback' => array( $this, 'check_upload_permissions' ),
				'args'                => array(
					'alt'         => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'title'       => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'caption'     => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'wp_kses_post',
					),
					'description' => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'wp_kses_post',
					),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/sepiid-media/(?P<id>\d+)',
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_media' ),
					'permission_callback' => array( $this, 'check_update_permissions' ),
					'args'                => $this->media_update_args(),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_media' ),
					'permission_callback' => array( $this, 'check_delete_permissions' ),
					'args'                => array(
						'id'           => $this->id_arg(),
						'force'        => array(
							'type'              => 'boolean',
							'default'           => false,
							'sanitize_callback' => 'rest_sanitize_boolean',
						),
						'allow_in_use' => array(
							'type'              => 'boolean',
							'default'           => false,
							'sanitize_callback' => 'rest_sanitize_boolean',
						),
					),
				),
			)
		);
	}

	/**
	 * Check that the API-key owner can manage products.
	 *
	 * @return true|\WP_Error
	 */
	public function check_read_permissions() {
		if ( ! get_current_user_id() ) {
			return $this->permission_error(
				'sepiid_bridge_auth_required',
				'برای اتصال به Sepiid Bridge یک کلید معتبر WooCommerce لازم است.',
				401
			);
		}

		if ( ! $this->can_manage_products() ) {
			return $this->permission_error(
				'sepiid_bridge_product_permission_required',
				'کاربر متصل به کلید WooCommerce اجازه مدیریت محصولات را ندارد.',
				403
			);
		}

		return true;
	}

	/**
	 * Check upload capabilities in addition to WooCommerce key permissions.
	 *
	 * @return true|\WP_Error
	 */
	public function check_upload_permissions() {
		$read_permission = $this->check_read_permissions();
		if ( is_wp_error( $read_permission ) ) {
			return $read_permission;
		}

		if ( ! $this->can_upload_media() ) {
			return $this->permission_error(
				'sepiid_bridge_upload_permission_required',
				'کاربر متصل به کلید WooCommerce باید مجوز upload_files داشته باشد.',
				403
			);
		}

		return true;
	}

	/**
	 * Check permission for updating one attachment.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function check_update_permissions( $request ) {
		$upload_permission = $this->check_upload_permissions();
		if ( is_wp_error( $upload_permission ) ) {
			return $upload_permission;
		}

		$id = absint( $request['id'] );
		if ( $id && ! current_user_can( 'edit_post', $id ) ) {
			return $this->permission_error(
				'sepiid_bridge_media_edit_forbidden',
				'این کلید اجازه ویرایش تصویر انتخاب‌شده را ندارد.',
				403
			);
		}

		return true;
	}

	/**
	 * Check permission for deleting one attachment.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function check_delete_permissions( $request ) {
		$read_permission = $this->check_read_permissions();
		if ( is_wp_error( $read_permission ) ) {
			return $read_permission;
		}

		$id = absint( $request['id'] );
		if ( ! current_user_can( 'delete_post', $id ) ) {
			return $this->permission_error(
				'sepiid_bridge_media_delete_forbidden',
				'این کلید اجازه حذف تصویر انتخاب‌شده را ندارد.',
				403
			);
		}

		return true;
	}

	/**
	 * Return a stable capability manifest for the CMS connection screen.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_health() {
		global $wp_version;

		$response = new \WP_REST_Response(
			array(
				'name'                => 'Sepiid Product Bridge',
				'version'             => VERSION,
				'contract_version'    => self::CONTRACT_VERSION,
				'connected'           => true,
				'woocommerce_active'  => class_exists( 'WooCommerce' ),
				'wordpress_version'   => isset( $wp_version ) ? (string) $wp_version : null,
				'woocommerce_version' => defined( 'WC_VERSION' ) ? WC_VERSION : null,
				'product_write'       => $this->can_manage_products(),
				'category_write'      => $this->can_manage_categories(),
				'media_upload'        => $this->can_upload_media(),
				'media_update'        => $this->can_upload_media(),
				'media_delete'        => current_user_can( 'delete_posts' ),
				'max_upload_bytes'    => $this->max_upload_bytes(),
				'allowed_mime_types'  => array_values( $this->allowed_mimes() ),
				'routes'              => array(
					'products'   => '/wp-json/wc/v3/products',
					'categories' => '/wp-json/wc/v3/products/categories',
					'media'      => '/wp-json/wc/v3/sepiid-media',
				),
			),
			200
		);

		$response->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0' );
		return $response;
	}

	/**
	 * Upload one verified image into the WordPress media library.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_media( $request ) {
		$started_at     = microtime( true );
		$correlation_id = sanitize_text_field( (string) $request->get_header( 'x-sepiid-correlation-id' ) );
		if ( ! preg_match( '/^[A-Za-z0-9-]{8,64}$/', $correlation_id ) ) {
			$correlation_id = wp_generate_uuid4();
		}

		$files = $request->get_file_params();
		$file  = ! empty( $files['file'] ) && is_array( $files['file'] ) ? $files['file'] : array();
		$this->log_media_observation(
			'wordpress_bridge_upload_received',
			array(
				'correlation_id' => $correlation_id,
				'file_size'      => isset( $file['size'] ) ? (int) $file['size'] : 0,
				'mime_type'      => isset( $file['type'] ) ? sanitize_mime_type( $file['type'] ) : 'unknown',
				'elapsed_ms'     => $this->elapsed_milliseconds( $started_at ),
			)
		);
		if ( empty( $files['file'] ) || ! is_array( $files['file'] ) ) {
			return $this->error(
				'sepiid_bridge_missing_file',
				'فایل تصویر ارسال نشده است.',
				400
			);
		}

		$upload_error = isset( $file['error'] ) ? (int) $file['error'] : UPLOAD_ERR_NO_FILE;
		if ( UPLOAD_ERR_OK !== $upload_error ) {
			return $this->upload_error( $upload_error );
		}

		$file_size = isset( $file['size'] ) ? (int) $file['size'] : 0;
		if ( $file_size <= 0 ) {
			return $this->error(
				'sepiid_bridge_empty_file',
				'فایل تصویر خالی است.',
				400
			);
		}

		if ( $file_size > $this->max_upload_bytes() ) {
			return $this->error(
				'sepiid_bridge_file_too_large',
				'حجم تصویر از سقف مجاز سرور بیشتر است.',
				413,
				array( 'max_upload_bytes' => $this->max_upload_bytes() )
			);
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';

		$file_name = isset( $file['name'] ) ? sanitize_file_name( wp_unslash( $file['name'] ) ) : '';
		$tmp_name  = isset( $file['tmp_name'] ) ? (string) $file['tmp_name'] : '';
		if ( '' === $file_name || '' === $tmp_name || ! file_exists( $tmp_name ) ) {
			return $this->error(
				'sepiid_bridge_invalid_upload',
				'اطلاعات فایل آپلودشده معتبر نیست.',
				400
			);
		}

		$file_type = wp_check_filetype_and_ext( $tmp_name, $file_name, $this->allowed_mimes() );
		if ( empty( $file_type['ext'] ) || empty( $file_type['type'] ) ) {
			return $this->error(
				'sepiid_bridge_invalid_image_type',
				'فقط تصویر واقعی با فرمت JPEG، PNG، WebP یا GIF پذیرفته می‌شود.',
				415
			);
		}

		if ( ! empty( $file_type['proper_filename'] ) ) {
			$file_name = sanitize_file_name( $file_type['proper_filename'] );
		}

		// media_handle_upload reads from $_FILES, while REST exposes the same data on the request.
		$_FILES['file']         = $file;
		$_FILES['file']['name'] = $file_name;

		$title = trim( (string) $request->get_param( 'title' ) );
		if ( '' === $title ) {
			$title = pathinfo( $file_name, PATHINFO_FILENAME );
		}

		$post_data = array(
			'post_title'   => sanitize_text_field( $title ),
			'post_excerpt' => wp_kses_post( (string) $request->get_param( 'caption' ) ),
			'post_content' => wp_kses_post( (string) $request->get_param( 'description' ) ),
		);

		$this->log_media_observation(
			'wordpress_media_handle_upload_started',
			array(
				'correlation_id' => $correlation_id,
				'file_size'      => $file_size,
				'mime_type'      => $file_type['type'],
				'elapsed_ms'     => $this->elapsed_milliseconds( $started_at ),
			)
		);

		$attachment_id = media_handle_upload(
			'file',
			0,
			$post_data,
			array(
				'test_form' => false,
				'mimes'     => $this->allowed_mimes(),
			)
		);

		if ( is_wp_error( $attachment_id ) ) {
			$this->log_media_observation(
				'wordpress_media_handle_upload_failed',
				array(
					'correlation_id' => $correlation_id,
					'file_size'      => $file_size,
					'mime_type'      => $file_type['type'],
					'elapsed_ms'     => $this->elapsed_milliseconds( $started_at ),
					'http_status'    => 500,
					'error_category' => 'media_handle_upload_failed',
				)
			);
			$this->log_error( 'Media upload failed.', $attachment_id );
			return $this->error(
				'sepiid_bridge_media_upload_failed',
				$attachment_id->get_error_message(),
				500
			);
		}

		$this->log_media_observation(
			'wordpress_media_handle_upload_completed',
			array(
				'correlation_id' => $correlation_id,
				'file_size'      => $file_size,
				'mime_type'      => $file_type['type'],
				'elapsed_ms'     => $this->elapsed_milliseconds( $started_at ),
				'http_status'    => 201,
				'attachment_id'  => (int) $attachment_id,
			)
		);

		$alt = sanitize_text_field( (string) $request->get_param( 'alt' ) );
		if ( '' !== $alt ) {
			update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt );
		}

		return new \WP_REST_Response( $this->prepare_media( $attachment_id ), 201 );
	}

	/**
	 * Update attachment text fields without replacing the image bytes.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_media( $request ) {
		$id         = absint( $request['id'] );
		$attachment = $this->get_image_attachment( $id );
		if ( is_wp_error( $attachment ) ) {
			return $attachment;
		}

		$post_update = array( 'ID' => $id );
		if ( $request->has_param( 'title' ) ) {
			$post_update['post_title'] = sanitize_text_field( (string) $request->get_param( 'title' ) );
		}
		if ( $request->has_param( 'caption' ) ) {
			$post_update['post_excerpt'] = wp_kses_post( (string) $request->get_param( 'caption' ) );
		}
		if ( $request->has_param( 'description' ) ) {
			$post_update['post_content'] = wp_kses_post( (string) $request->get_param( 'description' ) );
		}

		if ( count( $post_update ) > 1 ) {
			$updated = wp_update_post( wp_slash( $post_update ), true );
			if ( is_wp_error( $updated ) ) {
				$this->log_error( 'Media metadata update failed.', $updated );
				return $this->error(
					'sepiid_bridge_media_update_failed',
					$updated->get_error_message(),
					500
				);
			}
		}

		if ( $request->has_param( 'alt' ) ) {
			update_post_meta(
				$id,
				'_wp_attachment_image_alt',
				sanitize_text_field( (string) $request->get_param( 'alt' ) )
			);
		}

		return new \WP_REST_Response( $this->prepare_media( $id ), 200 );
	}

	/**
	 * Permanently delete an image only after explicit confirmation.
	 *
	 * Images still used by WooCommerce products or categories are protected unless
	 * allow_in_use=true is sent by an authorized client.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function delete_media( $request ) {
		$id         = absint( $request['id'] );
		$attachment = $this->get_image_attachment( $id );
		if ( is_wp_error( $attachment ) ) {
			return $attachment;
		}

		if ( ! rest_sanitize_boolean( $request->get_param( 'force' ) ) ) {
			return $this->error(
				'sepiid_bridge_force_delete_required',
				'برای حذف دائمی تصویر باید force=true ارسال شود.',
				400
			);
		}

		$usage = $this->find_woocommerce_usage( $id );
		if ( $usage['in_use'] && ! rest_sanitize_boolean( $request->get_param( 'allow_in_use' ) ) ) {
			return $this->error(
				'sepiid_bridge_media_in_use',
				'این تصویر هنوز در یک محصول یا دسته‌بندی WooCommerce استفاده می‌شود.',
				409,
				$usage
			);
		}

		$previous = $this->prepare_media( $id );
		$deleted  = wp_delete_attachment( $id, true );
		if ( ! $deleted ) {
			return $this->error(
				'sepiid_bridge_media_delete_failed',
				'وردپرس نتوانست تصویر را حذف کند.',
				500
			);
		}

		return new \WP_REST_Response(
			array(
				'deleted'  => true,
				'previous' => $previous,
			),
			200
		);
	}

	/**
	 * Schema for media updates.
	 *
	 * @return array
	 */
	private function media_update_args() {
		return array(
			'id'          => $this->id_arg(),
			'alt'         => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'title'       => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'caption'     => array(
				'type'              => 'string',
				'sanitize_callback' => 'wp_kses_post',
			),
			'description' => array(
				'type'              => 'string',
				'sanitize_callback' => 'wp_kses_post',
			),
		);
	}

	/**
	 * Schema for a positive attachment ID.
	 *
	 * @return array
	 */
	private function id_arg() {
		return array(
			'type'              => 'integer',
			'required'          => true,
			'sanitize_callback' => 'absint',
			'validate_callback' => static function ( $value ) {
				return is_numeric( $value ) && (int) $value > 0;
			},
		);
	}

	/**
	 * Supported image MIME types, keyed by WordPress extension pattern.
	 *
	 * @return array
	 */
	private function allowed_mimes() {
		return array(
			'jpg|jpeg|jpe' => 'image/jpeg',
			'png'          => 'image/png',
			'webp'         => 'image/webp',
			'gif'          => 'image/gif',
		);
	}

	/**
	 * Use the stricter of CMS and server upload limits.
	 *
	 * @return int
	 */
	private function max_upload_bytes() {
		$server_limit = (int) wp_max_upload_size();
		if ( $server_limit <= 0 ) {
			return self::MAX_UPLOAD_BYTES;
		}

		return min( self::MAX_UPLOAD_BYTES, $server_limit );
	}

	/**
	 * Determine whether the current API-key owner can manage products.
	 *
	 * @return bool
	 */
	private function can_manage_products() {
		return current_user_can( 'edit_products' ) || current_user_can( 'manage_woocommerce' );
	}

	/**
	 * Determine whether the current API-key owner can manage product categories.
	 *
	 * @return bool
	 */
	private function can_manage_categories() {
		return current_user_can( 'manage_product_terms' ) || current_user_can( 'manage_woocommerce' );
	}

	/**
	 * Determine whether media writes are available for the current API-key owner.
	 *
	 * @return bool
	 */
	private function can_upload_media() {
		return $this->can_manage_products() && current_user_can( 'upload_files' );
	}

	/**
	 * Load and validate one image attachment.
	 *
	 * @param int $id Attachment ID.
	 * @return \WP_Post|\WP_Error
	 */
	private function get_image_attachment( $id ) {
		$attachment = get_post( $id );
		if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
			return $this->error(
				'sepiid_bridge_media_not_found',
				'تصویر موردنظر در رسانه وردپرس پیدا نشد.',
				404
			);
		}

		if ( ! wp_attachment_is_image( $id ) ) {
			return $this->error(
				'sepiid_bridge_media_not_image',
				'فایل انتخاب‌شده تصویر نیست.',
				415
			);
		}

		return $attachment;
	}

	/**
	 * Convert an attachment into the shape consumed by Sepiid CMS.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array
	 */
	private function prepare_media( $attachment_id ) {
		$metadata = wp_get_attachment_metadata( $attachment_id );
		$src      = wp_get_attachment_url( $attachment_id );

		return array(
			'id'        => (int) $attachment_id,
			'src'       => $src ? esc_url_raw( $src ) : '',
			'name'      => get_the_title( $attachment_id ),
			'alt'       => (string) get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ),
			'mime_type' => (string) get_post_mime_type( $attachment_id ),
			'width'     => is_array( $metadata ) && isset( $metadata['width'] ) ? (int) $metadata['width'] : null,
			'height'    => is_array( $metadata ) && isset( $metadata['height'] ) ? (int) $metadata['height'] : null,
			'filesize'  => is_array( $metadata ) && isset( $metadata['filesize'] ) ? (int) $metadata['filesize'] : null,
		);
	}

	/**
	 * Find WooCommerce product and category references before permanent deletion.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array
	 */
	private function find_woocommerce_usage( $attachment_id ) {
		$candidate_products = get_posts(
			array(
				'post_type'              => array( 'product', 'product_variation' ),
				'post_status'            => 'any',
				'posts_per_page'         => -1,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_meta_cache' => true,
				'update_post_term_cache' => false,
				'meta_query'             => array(
					'relation' => 'OR',
					array(
						'key'     => '_thumbnail_id',
						'value'   => $attachment_id,
						'compare' => '=',
					),
					array(
						'key'     => '_product_image_gallery',
						'value'   => (string) $attachment_id,
						'compare' => 'LIKE',
					),
				),
			)
		);

		$product_ids = array();
		foreach ( $candidate_products as $product_id ) {
			$thumbnail_id = absint( get_post_meta( $product_id, '_thumbnail_id', true ) );
			$gallery_ids  = array_filter(
				array_map(
					'absint',
					explode( ',', (string) get_post_meta( $product_id, '_product_image_gallery', true ) )
				)
			);

			if ( $thumbnail_id === $attachment_id || in_array( $attachment_id, $gallery_ids, true ) ) {
				$product_ids[] = (int) $product_id;
			}
		}

		$category_ids = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => false,
				'fields'     => 'ids',
				'meta_query' => array(
					array(
						'key'     => 'thumbnail_id',
						'value'   => $attachment_id,
						'compare' => '=',
					),
				),
			)
		);

		if ( is_wp_error( $category_ids ) ) {
			$category_ids = array();
		}

		$product_ids  = array_values( array_unique( array_map( 'absint', $product_ids ) ) );
		$category_ids = array_values( array_unique( array_map( 'absint', $category_ids ) ) );

		return array(
			'in_use'       => ! empty( $product_ids ) || ! empty( $category_ids ),
			'product_ids'  => $product_ids,
			'category_ids' => $category_ids,
		);
	}

	/**
	 * Convert PHP upload errors to stable REST errors.
	 *
	 * @param int $error_code PHP upload error constant.
	 * @return \WP_Error
	 */
	private function upload_error( $error_code ) {
		$errors = array(
			UPLOAD_ERR_INI_SIZE   => array( 'sepiid_bridge_server_upload_limit', 'حجم تصویر از محدودیت PHP سرور بیشتر است.', 413 ),
			UPLOAD_ERR_FORM_SIZE  => array( 'sepiid_bridge_form_upload_limit', 'حجم تصویر از محدودیت فرم بیشتر است.', 413 ),
			UPLOAD_ERR_PARTIAL    => array( 'sepiid_bridge_partial_upload', 'آپلود تصویر ناقص ماند؛ دوباره تلاش کن.', 400 ),
			UPLOAD_ERR_NO_FILE    => array( 'sepiid_bridge_missing_file', 'فایل تصویر ارسال نشده است.', 400 ),
			UPLOAD_ERR_NO_TMP_DIR => array( 'sepiid_bridge_missing_temp_dir', 'پوشه موقت آپلود روی سرور در دسترس نیست.', 500 ),
			UPLOAD_ERR_CANT_WRITE => array( 'sepiid_bridge_disk_write_failed', 'سرور نتوانست فایل تصویر را ذخیره کند.', 500 ),
			UPLOAD_ERR_EXTENSION  => array( 'sepiid_bridge_upload_blocked', 'یک افزونه سرور آپلود تصویر را متوقف کرد.', 500 ),
		);

		$error = isset( $errors[ $error_code ] )
			? $errors[ $error_code ]
			: array( 'sepiid_bridge_unknown_upload_error', 'آپلود تصویر با خطای ناشناخته متوقف شد.', 500 );

		return $this->error( $error[0], $error[1], $error[2] );
	}

	/**
	 * Create a REST permission error.
	 *
	 * @param string $code Error code.
	 * @param string $message Error message.
	 * @param int    $status HTTP status.
	 * @return \WP_Error
	 */
	private function permission_error( $code, $message, $status ) {
		return new \WP_Error( $code, $message, array( 'status' => $status ) );
	}

	/**
	 * Create a REST error with optional response data.
	 *
	 * @param string $code Error code.
	 * @param string $message Error message.
	 * @param int    $status HTTP status.
	 * @param array  $data Extra response data.
	 * @return \WP_Error
	 */
	private function error( $code, $message, $status, $data = array() ) {
		return new \WP_Error(
			$code,
			$message,
			array_merge( array( 'status' => $status ), $data )
		);
	}

	/**
	 * Log server-side media failures without credentials or request bodies.
	 *
	 * @param string    $message Log message.
	 * @param \WP_Error $error WordPress error.
	 * @return void
	 */
	private function log_error( $message, $error ) {
		if ( ! function_exists( 'wc_get_logger' ) ) {
			return;
		}

		wc_get_logger()->error(
			$message,
			array(
				'source'     => 'sepiid-product-bridge',
				'error_code' => $error->get_error_code(),
				'user_id'    => get_current_user_id(),
			)
		);
	}

	/**
	 * Emit a whitelisted, credential-free media timing checkpoint.
	 *
	 * @param string $marker Stable checkpoint name.
	 * @param array  $context Safe observation fields.
	 * @return void
	 */
	private function log_media_observation( $marker, $context ) {
		if ( ! function_exists( 'wc_get_logger' ) ) {
			return;
		}

		$safe_context = array( 'source' => 'sepiid-product-bridge' );
		$allowed_keys = array(
			'correlation_id',
			'file_size',
			'mime_type',
			'elapsed_ms',
			'http_status',
			'attachment_id',
			'error_category',
		);

		foreach ( $allowed_keys as $key ) {
			if ( ! array_key_exists( $key, $context ) ) {
				continue;
			}

			if ( in_array( $key, array( 'file_size', 'elapsed_ms', 'http_status', 'attachment_id' ), true ) ) {
				$safe_context[ $key ] = max( 0, (int) $context[ $key ] );
			} else {
				$safe_context[ $key ] = substr( sanitize_text_field( (string) $context[ $key ] ), 0, 200 );
			}
		}

		wc_get_logger()->info(
			'[sepiid-media] ' . sanitize_key( $marker ),
			$safe_context
		);
	}

	/**
	 * Convert a request-relative timestamp to integer milliseconds.
	 *
	 * @param float $started_at Request start from microtime(true).
	 * @return int
	 */
	private function elapsed_milliseconds( $started_at ) {
		return max( 0, (int) round( ( microtime( true ) - $started_at ) * 1000 ) );
	}
}
