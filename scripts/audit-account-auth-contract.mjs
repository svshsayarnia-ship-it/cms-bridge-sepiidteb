import { readFile } from "node:fs/promises";

const checks = [
  {
    file: "app/components/SiteHeader.tsx",
    needles: ['className="sb-header__account"', 'href="/account"', "ورود / عضویت"],
  },
  {
    file: "app/account-responsive.css",
    needles: [".sb-header__account {", "display: inline-flex !important", "@media (min-width: 1101px)"],
  },
  {
    file: "app/api/account/auth/[action]/route.ts",
    needles: [
      '"register"',
      '"logout"',
      '"otp-request"',
      '"otp-verify"',
      '"password-request"',
      '"password-reset"',
      'action !== "session"',
      'action !== "profile"',
    ],
  },
  {
    file: "app/components/CustomerAccount.tsx",
    needles: [
      'accountRequest<OtpRequestResult>("otp-request"',
      'accountRequest<OtpVerifyResult>("otp-verify"',
      'accountRequest<{ user: CustomerUser }>("register"',
      'sepiid_registration_required',
      'شماره تأیید شد. حالا اطلاعات حساب و رمز را کامل کن.',
      'function registrationValidationError()',
      'normalizeIranMobileInput(result.user.phone) !== profile.phone',
      '"profile"',
      '"logout"',
    ],
  },
  {
    file: "wordpress/sepiid-product-bridge/includes/class-customer-otp-controller.php",
    needles: [
      "/auth/otp/request",
      "/auth/otp/verify",
      "sepiid_send_otp_sms",
      "random_int( 100000, 999999 )",
      "sepiid_registration_required",
      "legacy_phone_login_candidates",
      "get_user_by( 'login', $login )",
      "sepiid_customer_identity",
      "phone_normalized = %s AND user_id IS NOT NULL",
      "'digits_phone'",
      "'digits_phone_no'",
      "WHERE meta_key IN ({$placeholders})",
      "update_user_meta( (int) $user->ID, 'sepiid_phone_normalized', $verified_phone )",
    ],
  },
  {
    file: "wordpress/sepiid-product-bridge/includes/class-customer-auth-controller.php",
    needles: [
      "update_user_meta( $user_id, 'sepiid_phone_normalized', $phone )",
      "sepiid_registration_incomplete",
      "sepiid_session_not_persisted",
      "registration_completed",
      "phone_hash=",
    ],
  },
  {
    file: "wordpress/sepiid-product-bridge/includes/class-customer-identity-controller.php",
    needles: [
      "const RESERVATION_TTL = 1200",
      "user_id IS NULL AND created_at < %s",
    ],
  },
  {
    file: "wordpress/sepiid-product-bridge/includes/class-razban-otp-provider.php",
    needles: [
      "SEPIID_SMS_PROVIDER",
      "has_complete_razban_config()",
      "? 'razban' : 'kavenegar'",
      "SEPIID_RAZBAN_API_TOKEN",
      "SEPIID_RAZBAN_PATTERN",
      "SEPIID_RAZBAN_FROM_NUMBER",
      "https://edge.ippanel.com/v1/api/send",
      "'sending_type' => 'pattern'",
      "'Authorization' => $config['api_token']",
      "'recipients'   => array( $recipient )",
      "'params'       => array(",
      "=> (int) $code",
      "provider_message",
      "sepiid_razban_otp_transport",
    ],
  },
  {
    file: "wordpress/sepiid-product-bridge/includes/class-kavenegar-direct-otp-provider.php",
    needles: [
      "SEPIID_SMS_PROVIDER",
      "'kavenegar' !== $provider",
      "SEPIID_KAVENEGAR_API_KEY",
      "SEPIID_KAVENEGAR_SENDER",
    ],
  },
  {
    file: "wordpress/sepiid-product-bridge/sepiid-product-bridge.php",
    needles: ["Version:           1.8.15", "const VERSION = '1.8.15';"],
  },
];

const failures = [];
for (const check of checks) {
  const source = await readFile(check.file, "utf8");
  for (const needle of check.needles) {
    if (!source.includes(needle)) failures.push(`${check.file}: missing ${needle}`);
  }
}

if (failures.length) {
  console.error("Account/auth contract audit failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Account/auth contract audit passed.");
