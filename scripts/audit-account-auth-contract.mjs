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
      'await completeRegistration(result.phoneProof)',
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
