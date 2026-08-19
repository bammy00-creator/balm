// Accepts Nigerian numbers in 0803... or +234803... form (SPEC section 6) and
// normalizes to a plain 234XXXXXXXXXX string, which also happens to be the
// format wa.me click-to-chat links need (SPEC section 9, built in Milestone 4).
export function normalizeNigerianPhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");

  if (digits.length === 11 && digits.startsWith("0")) {
    return "234" + digits.slice(1);
  }
  if (digits.length === 13 && digits.startsWith("234")) {
    return digits;
  }
  if (digits.length === 10 && /^[789]/.test(digits)) {
    return "234" + digits;
  }
  return null;
}
