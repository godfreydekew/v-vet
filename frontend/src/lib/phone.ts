/**
 * Builds a phone number in the same format WhatsApp (Meta) uses:
 * country dial code + local number, digits only, no "+".
 *
 * Examples:
 *   ("263", "077 123 4567")    -> "263771234567"
 *   ("263", "+263 77 123 4567") -> "263771234567"  (full international number typed in)
 */
export function formatPhoneForWhatsApp(dialCode: string, localNumber: string): string {
  const trimmedLocal = localNumber.trim();

  // A number starting with "+" already includes its country code, so use it as-is.
  if (trimmedLocal.startsWith('+')) {
    return trimmedLocal.replace(/\D/g, '');
  }

  const dialDigits = dialCode.replace(/\D/g, '');
  let localDigits = trimmedLocal.replace(/\D/g, '');

  // Local numbers are often written with a trunk "0" prefix (e.g. 0771234567).
  // That 0 is dropped when the country code is added.
  while (localDigits.startsWith('0')) {
    localDigits = localDigits.slice(1);
  }

  return dialDigits + localDigits;
}
