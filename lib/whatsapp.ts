/** Dígitos BR (10–11) sem código do país. */
export function normalizeWhatsappDigits(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  if (digits.length < 10 || digits.length > 11) return null;
  return digits;
}

export function formatWhatsappDisplay(digits: string) {
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

/** Monta link wa.me a partir de telefone livre (com ou sem máscara). */
export function whatsappUrlFromPhone(phone: string, message?: string): string | null {
  const raw = phone.replace(/\D/g, "");
  if (!raw) return null;
  let e164 = raw;
  if (e164.length === 10 || e164.length === 11) {
    e164 = `55${e164}`;
  } else if (e164.startsWith("55") && (e164.length === 12 || e164.length === 13)) {
    // ok
  } else if (e164.length < 12) {
    return null;
  }
  const base = `https://wa.me/${e164}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}
