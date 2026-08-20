// phone must already be normalized (lib/phone.ts) to a plain 234XXXXXXXXXX
// string - that's exactly what wa.me expects.
export function whatsappClickToChatUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
