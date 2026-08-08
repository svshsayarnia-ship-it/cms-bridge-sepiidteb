=== Sepiid Product Bridge ===
Contributors: sepiidbeauty
Tags: woocommerce, rest-api, cms, media
Requires at least: 6.9
Tested up to: 7.0.2
Requires PHP: 7.4
Stable tag: 1.6.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

اتصال امن Sepiid CMS به WooCommerce و WordPress برای مدیریت محصولات، دسته‌بندی‌ها، رسانه و محتوای نمایشی سایت.

== Description ==

Sepiid Product Bridge قابلیت‌های تکمیلی موردنیاز Sepiid CMS را به WooCommerce اضافه می‌کند.

* محصولات، قیمت، موجودی، توضیحات، وضعیت انتشار و دسته‌بندی‌ها با REST API رسمی WooCommerce مدیریت می‌شوند.
* افزونه مسیر امن آپلود، ویرایش و حذف رسانه را اضافه می‌کند.
* تمام مسیرها زیر `wc/v3` هستند و از Consumer Key و Consumer Secret ووکامرس استفاده می‌کنند.
* هیچ کلید، رمز یا داده‌ای در تنظیمات افزونه ذخیره نمی‌شود.
* افزونه قالب، Elementor، Woodmart، سفارش‌ها و ساختار پایگاه داده را تغییر نمی‌دهد.

== Installation ==

1. فایل ZIP افزونه را از مسیر افزونه‌ها ← افزودن افزونه ← بارگذاری افزونه نصب کن.
2. افزونه Sepiid Product Bridge را فعال کن.
3. از WooCommerce ← Sepiid Bridge وضعیت اتصال را بررسی کن.
4. در WooCommerce ← پیکربندی ← پیشرفته ← REST API یک کلید با سطح Read/Write بساز.
5. کلید باید متعلق به کاربری باشد که اجازه مدیریت محصول و `upload_files` دارد.
6. آدرس وردپرس و کلیدها را در Environment Variables پروژه CMS قرار بده.

== REST Contract ==

تمام مسیرهای زیر به احراز هویت WooCommerce REST API نیاز دارند:

* `GET /wp-json/wc/v3/sepiid-bridge/health`
* `POST /wp-json/wc/v3/sepiid-media`
* `POST|PUT|PATCH /wp-json/wc/v3/sepiid-media/{id}`
* `DELETE /wp-json/wc/v3/sepiid-media/{id}?force=true`
* `GET /wp-json/wc/v3/sepiid-site-presentation`
* `PUT|PATCH /wp-json/wc/v3/sepiid-site-presentation`

مسیر `sepiid-site-presentation` محتوای نمایشی قابل ویرایش سایت را جدا از داده‌های محصول و دسته‌بندی ذخیره می‌کند. اگر هنوز تنظیمی ذخیره نشده باشد، پاسخ GET مقدار `presentation: null` برمی‌گرداند تا CMS از مقادیر پیش‌فرض کد استفاده کند.

آپلود فقط JPEG، PNG، WebP و GIF واقعی را می‌پذیرد. سقف هر فایل، مقدار کمتر بین 10MB و محدودیت سرور است.

حذف دائمی رسانه‌ای که هنوز در محصول یا دسته‌بندی WooCommerce استفاده می‌شود، به‌صورت پیش‌فرض با خطای 409 متوقف می‌شود. برای حذف آگاهانه چنین فایلی باید `allow_in_use=true` نیز ارسال شود.

== Security ==

* مسیر عمومی یا permission callback باز وجود ندارد.
* مجوز REST key ووکامرس و قابلیت‌های کاربر WordPress هر دو بررسی می‌شوند.
* MIME واقعی فایل با API رسمی WordPress بررسی می‌شود.
* خطاهای داخلی بدون Consumer Secret و بدون بدنه درخواست در لاگ WooCommerce ثبت می‌شوند.
* CORS عمومی، nonce ثابت، رمز داخلی یا کلید پنهان در افزونه وجود ندارد.

== Troubleshooting ==

= CMS پیام fetch failed نشان می‌دهد =

1. `WORDPRESS_URL` باید آدرس اصلی HTTPS وردپرس و بدون `/wp-json` باشد.
2. Consumer Key و Consumer Secret باید مربوط به یک کلید فعال Read/Write باشند.
3. اگر وب‌سرور هدر Authorization را حذف می‌کند، در CMS مقدار `WOOCOMMERCE_AUTH_MODE=query` را استفاده کن.
4. مسیر WooCommerce ← وضعیت ← گزارش‌ها و منبع `sepiid-product-bridge` را بررسی کن.

= دکمه آپلود تصویر در CMS فعال نیست =

1. افزونه باید فعال باشد.
2. health endpoint باید با همان کلید REST پاسخ 200 بدهد.
3. کاربر مالک کلید باید مجوز `upload_files` و مدیریت محصولات داشته باشد.
4. کلید REST باید Read/Write باشد، نه Read-only.

= بازکردن health endpoint در مرورگر خطای 401 می‌دهد =

صحیح است. مرورگر بدون Consumer Key و Consumer Secret نباید به این مسیر دسترسی داشته باشد. آزمون واقعی باید از CMS یا ابزار API امن انجام شود.

== Changelog ==

= 1.6.0 =

* اضافه‌شدن REST API امن برای مدیریت Site Presentation.
* ذخیره محتوای نمایشی سایت در WordPress option مستقل از WooCommerce product/category data.
* پشتیبانی از GET و ویرایش تنظیمات Hero صفحه اصلی.
* اعتبارسنجی متن، لینک داخلی، URL امن و تصویر Hero.
* حفظ fallback کد زمانی که هنوز تنظیمی در WordPress ذخیره نشده است.
* احراز هویت و کنترل capability با همان WooCommerce REST credentials موجود.

= 1.5.0 =

* هماهنگی قرارداد با Sepiid CMS فعلی.
* health-check پایدار همراه با capability manifest.
* آپلود امن JPEG، PNG، WebP و GIF با بررسی MIME واقعی و محدودیت حجم.
* ویرایش alt، عنوان، کپشن و توضیح رسانه.
* حذف محافظت‌شده رسانه با تشخیص استفاده در محصول و دسته‌بندی.
* احراز هویت کامل با WooCommerce REST API key و کنترل قابلیت‌های WordPress.
* صفحه وضعیت اتصال داخل منوی WooCommerce.
* ثبت خطاهای سرور بدون اطلاعات محرمانه در WooCommerce logs.
* اعلام سازگاری HPOS؛ افزونه هیچ داده سفارشی سفارش ایجاد نمی‌کند.

