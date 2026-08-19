const PERSIAN_OR_ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u;

export type PasswordPolicyState = {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasThreeClasses: boolean;
  valid: boolean;
};

export function hasPersianKeyboardInput(value: string) {
  return PERSIAN_OR_ARABIC_SCRIPT.test(value);
}

export function toAsciiDigits(value: string) {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)));
}

/**
 * Keep the public account form deliberately strict: users enter the canonical
 * Iranian local mobile format only (09xxxxxxxxx). The backend still normalizes
 * legacy/international formats defensively, but the storefront never lets a
 * malformed value progress to the SMS step.
 */
export function normalizeIranMobileInput(value: string) {
  return toAsciiDigits(value).replace(/\D/g, "").slice(0, 11);
}

export function isValidIranMobile(value: string) {
  return /^09\d{9}$/.test(value);
}

export function iranMobileValidationMessage(value: string) {
  if (!value) return "";
  if (!value.startsWith("09")) return "شماره موبایل باید با 09 شروع شود.";
  if (value.length !== 11) return "شماره موبایل باید دقیقاً ۱۱ رقم باشد.";
  return isValidIranMobile(value) ? "" : "شماره موبایل معتبر نیست.";
}

export function passwordPolicyState(value: string): PasswordPolicyState {
  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const classCount = [hasLowercase, hasUppercase, hasNumber, hasSymbol].filter(Boolean).length;
  const minLength = value.length >= 10;
  const hasLetter = hasLowercase || hasUppercase;
  const hasThreeClasses = classCount >= 3;

  return {
    minLength,
    hasLetter,
    hasNumber,
    hasThreeClasses,
    valid: minLength && hasLetter && hasNumber && hasThreeClasses,
  };
}
