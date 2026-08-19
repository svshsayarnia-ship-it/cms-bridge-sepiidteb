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
